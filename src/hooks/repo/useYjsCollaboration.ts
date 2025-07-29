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
  AwarenessState,
} from '@/types/repo/yjs.types';

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
  const { setConnectionStatus, addUser, removeUser, joinRoom, leaveRoom, setCurrentUser } =
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
        providerRef.current.destroy();
        providerRef.current = null;
      }

      // Yjs Document 정리
      if (yjsDocRef.current) {
        yjsDocRef.current.destroy();
        yjsDocRef.current = null;
      }

      isInitializedRef.current = false;
      setError(null);
      leaveRoom();
    } catch (cleanupError) {
      console.error('정리 중 오류 발생:', cleanupError);
    } finally {
      cleanupInProgressRef.current = false;
    }
  }, [leaveRoom]);

  // Awareness 상태 처리
  const handleAwarenessChange = useCallback(() => {
    const provider = providerRef.current;
    if (!provider) return;

    try {
      const states = provider.awareness.getStates();
      const activeUserIds = new Set<string>();

      // 다른 사용자들의 상태 처리
      states.forEach((state: unknown, clientId: number) => {
        const typedState = state as AwarenessState;
        if (clientId !== provider.awareness.clientID && typedState.user) {
          const userIdStr = String(clientId);
          activeUserIds.add(userIdStr);

          addUser({
            id: userIdStr,
            name: typedState.user.name,
            color: typedState.user.color,
            cursor: typedState.cursor,
            selection: typedState.selection,
          });
        }
      });

      // 비활성 사용자 제거
      const { users } = useCollaborationStore.getState();
      users.forEach(user => {
        if (!activeUserIds.has(user.id)) {
          removeUser(user.id);
        }
      });

      console.log(`현재 이 파일에 있는 사람: ${states.size}명`);
    } catch (awarenessError) {
      console.error('Awareness 처리 중 오류:', awarenessError);
    }
  }, [addUser, removeUser]);

  // 커서 위치 변경 핸들러
  const handleCursorChange = useCallback(
    (event: { position: { lineNumber: number; column: number } }) => {
      const provider = providerRef.current;
      if (!provider) return;

      try {
        const cursorPosition = {
          line: event.position.lineNumber,
          column: event.position.column,
        };

        provider.awareness.setLocalStateField('cursor', cursorPosition);

        const { currentUser } = useCollaborationStore.getState();
        if (currentUser.id) {
          useCollaborationStore.getState().updateUserCursor(currentUser.id, cursorPosition);
        }
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

      // 현재 사용자 설정
      const currentUser = {
        id: userId,
        name: userName,
        color: generateUserColor(userId),
      };
      setCurrentUser(currentUser);

      // 룸 참가
      joinRoom(roomId);

      // Yjs Document 생성
      const yjsDocument = new Y.Doc() as YjsDocument;
      yjsDocRef.current = yjsDocument;
      const yText = yjsDocument.getText('monaco-content');

      // WebSocket Provider 생성
      const wsUrl = getWebSocketUrl();
      console.log(`WebSocket 연결 시도: ${wsUrl}`);

      const provider = new WebsocketProvider(wsUrl, roomId, yjsDocument, {
        connect: true,
        maxBackoffTime: 2000,
      });

      // 타입 안전성을 위해 필요한 속성들만 확인
      const typedProvider = provider as unknown as YjsProvider;
      providerRef.current = typedProvider;

      // Monaco Editor 모델 가져오기
      const model = editor.getModel();
      if (!model) {
        throw new Error('Monaco Editor 모델을 찾을 수 없습니다.');
      }

      // Monaco 바인딩 생성
      const editorSet = new Set([editor]);
      const binding = new MonacoBinding(
        yText,
        model as never,
        editorSet as never,
        (typedProvider as any).awareness // eslint-disable-line @typescript-eslint/no-explicit-any
      ) as MonacoBindingType;
      bindingRef.current = binding;

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
