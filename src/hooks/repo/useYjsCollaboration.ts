import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCollaborationStore, generateUserColor } from '@/stores/collaborationStore';
import type {
  YjsCollaborationConfig,
  YjsCollaborationReturn,
  YjsDocument,
  YjsProvider,
  MonacoBindingType,
  Disposable,
} from '@/types/repo/yjs.types';

// Awareness state 타입 정의
interface AwarenessState {
  user?: {
    id: string;
    name: string;
    color: string;
  };
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

// WebSocket URL 설정
const getWebSocketUrl = (): string => {
  return import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
};

export const useYjsCollaboration = ({
  roomId,
  editor,
  userId,
  userName,
  enabled = true,
}: YjsCollaborationConfig): YjsCollaborationReturn => {
  // State
  const [error, setError] = useState<string | null>(null);

  // Refs
  const yjsDocRef = useRef<YjsDocument | null>(null);
  const providerRef = useRef<YjsProvider | null>(null);
  const bindingRef = useRef<MonacoBindingType | null>(null);
  const cursorDisposableRef = useRef<Disposable | null>(null);
  const isInitializedRef = useRef(false);
  const cleanupInProgressRef = useRef(false);

  // Store actions
  const { setConnectionStatus, addUser, joinRoom, leaveRoom, setCurrentUser } =
    useCollaborationStore();

  // 정리 함수
  const cleanup = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    console.log('Yjs 연결 정리 중...');

    try {
      // 커서 이벤트 리스너 정리
      if (cursorDisposableRef.current) {
        cursorDisposableRef.current.dispose();
        cursorDisposableRef.current = null;
      }

      // Monaco 바인딩 정리
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      // WebSocket Provider 정리
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
        providerRef.current = null;
      }

      // Yjs Document 정리
      if (yjsDocRef.current) {
        yjsDocRef.current.destroy();
        yjsDocRef.current = null;
      }

      // 룸 떠나기
      if (roomId) {
        leaveRoom();
      }

      // 상태 초기화
      setConnectionStatus(false);
      setError(null);
    } catch (cleanupError) {
      console.error('Yjs 정리 중 오류:', cleanupError);
    } finally {
      isInitializedRef.current = false;
      cleanupInProgressRef.current = false;
      console.log('Yjs 연결 정리 완료');
    }
  }, [roomId, leaveRoom, setConnectionStatus]);

  // Awareness 변경 핸들러
  const handleAwarenessChange = useCallback(() => {
    const provider = providerRef.current;
    if (!provider?.awareness) return;

    try {
      const states = provider.awareness.getStates();

      for (const [clientId, state] of states.entries()) {
        // 타입 안전하게 state 처리
        const awarenessState = state as AwarenessState;

        if (awarenessState.user && clientId !== provider.awareness.clientID) {
          const user = {
            id: awarenessState.user.id,
            name: awarenessState.user.name,
            color: awarenessState.user.color,
            cursor: awarenessState.cursor,
            selection: awarenessState.selection,
            lastSeen: Date.now(),
          };
          addUser(user);
        }
      }
    } catch (awarenessError) {
      console.error('Awareness 변경 처리 중 오류:', awarenessError);
    }
  }, [addUser]);

  // 커서 변경 핸들러
  const handleCursorChange = useCallback(
    (event: { position: { lineNumber: number; column: number } }) => {
      const provider = providerRef.current;
      if (!provider?.awareness) return;

      try {
        const cursorPosition = {
          line: event.position.lineNumber,
          column: event.position.column,
        };

        provider.awareness.setLocalStateField('cursor', cursorPosition);
      } catch (cursorError) {
        console.error('커서 위치 업데이트 중 오류:', cursorError);
      }
    },
    []
  );

  // 초기화 함수
  const initialize = useCallback(async () => {
    if (
      !editor ||
      !roomId ||
      !enabled ||
      isInitializedRef.current ||
      cleanupInProgressRef.current
    ) {
      return;
    }

    try {
      console.log('Yjs 협업 초기화 시작:', roomId);

      // 1. 현재 사용자 설정
      const currentUser = {
        id: userId,
        name: userName,
        color: generateUserColor(userId),
        lastSeen: Date.now(),
      };
      setCurrentUser(currentUser);

      // 2. 룸 참가
      joinRoom(roomId);

      // 3. Yjs Document 생성
      const yjsDocument = new Y.Doc() as YjsDocument;
      yjsDocRef.current = yjsDocument;
      const yText = yjsDocument.getText('monaco-content');

      // 4. WebSocket Provider 생성
      const wsUrl = getWebSocketUrl();
      console.log(`WebSocket 연결 시도: ${wsUrl}/${roomId}`);

      const provider = new WebsocketProvider(wsUrl, roomId, yjsDocument, {
        connect: true,
        maxBackoffTime: 2000,
      });

      const typedProvider = provider as unknown as YjsProvider;
      providerRef.current = typedProvider;

      // 5. Monaco Editor 모델 확인
      const model = editor.getModel();
      if (!model) {
        throw new Error('Monaco Editor 모델을 찾을 수 없습니다.');
      }

      const initialModelContent = model.getValue();

      // 6. Monaco 바인딩 생성
      const editorSet = new Set([editor]);
      const binding = new MonacoBinding(
        yText,
        model as never,
        editorSet as never,
        typedProvider.awareness as never
      ) as MonacoBindingType;
      bindingRef.current = binding;

      const syncInitialContent = () => {
        const currentYjsContent = yText.toString();

        console.log('초기 내용 동기화 확인:', {
          roomId,
          initialContentLength: initialModelContent.length,
          yjsContentLength: currentYjsContent.length,
          shouldSync: currentYjsContent.length === 0 && initialModelContent.length > 0,
        });

        // 핵심 수정: Yjs 문서가 비어있고 탭에 기존 내용이 있다면 Yjs에 설정
        if (currentYjsContent.length === 0 && initialModelContent.length > 0) {
          console.log('첫 사용자: API 내용을 Yjs 문서에 초기화');
          yText.insert(0, initialModelContent);
        } else if (currentYjsContent.length > 0) {
          console.log('기존 사용자 있음: Yjs 내용이 Monaco에 자동 동기화됨');
        }
      };

      // Provider 상태 이벤트 핸들러
      typedProvider.on('status', (event: { status: string }) => {
        console.log(`연결 상태 변경: ${event.status}`);
        const isConnected = event.status === 'connected';
        setConnectionStatus(isConnected);

        if (isConnected) {
          console.log('WebSocket 연결 성공');
          setError(null);

          // 연결 성공 시 사용자 정보 설정
          typedProvider.awareness.setLocalStateField('user', currentUser);
          setTimeout(syncInitialContent, 300);
        } else {
          console.log('WebSocket 연결 실패 또는 끊김');
          if (event.status === 'disconnected') {
            setError('연결이 끊어졌습니다.');
          }
        }
      });

      // Awareness 변경 이벤트 핸들러
      typedProvider.awareness.on('change', handleAwarenessChange);

      // 커서 위치 변경 이벤트 핸들러
      const cursorDisposable = editor.onDidChangeCursorPosition(handleCursorChange);
      cursorDisposableRef.current = cursorDisposable;

      isInitializedRef.current = true;
      console.log('Yjs 협업 초기화 완료');
    } catch (initError) {
      console.error('Yjs 초기화 실패:', initError);
      setError(initError instanceof Error ? initError.message : '초기화에 실패했습니다.');
      cleanup();
    }
  }, [
    editor,
    roomId,
    userId,
    userName,
    enabled,
    joinRoom,
    setCurrentUser,
    setConnectionStatus,
    handleAwarenessChange,
    handleCursorChange,
    cleanup,
  ]);

  // 초기화 및 정리 Effect
  useEffect(() => {
    if (enabled && editor && roomId && userId && userName) {
      initialize().catch(initError => {
        console.error('Yjs 초기화 Effect 에러:', initError);
        setError('협업 기능 초기화에 실패했습니다.');
      });
    }

    return cleanup;
  }, [enabled, editor, roomId, userId, userName, initialize, cleanup]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 상태 계산
  const isConnected = Boolean(providerRef.current?.wsconnected);
  const isLoading =
    enabled && Boolean(roomId) && Boolean(editor) && !isInitializedRef.current && !error;

  return {
    isConnected,
    isLoading,
    error,
  };
};
