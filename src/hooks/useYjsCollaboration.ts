import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCollaborationStore } from '@/stores/collaborationStore';

// Monaco Editor 관련 타입 정의
interface EditorInstance {
  getModel(): TextModel | null;
  onDidChangeCursorPosition(callback: (event: CursorChangeEvent) => void): { dispose(): void };
}

interface TextModel {
  uri: unknown;
  getValue(): string;
  setValue(value: string): void;
}

interface CursorChangeEvent {
  position: {
    lineNumber: number;
    column: number;
  };
}

// Hook props 타입
interface UseYjsCollaborationProps {
  roomId: string;
  editor: EditorInstance | null;
  userId: string;
  userName: string;
  enabled?: boolean;
}

// Hook return 타입
interface UseYjsCollaborationReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
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
}: UseYjsCollaborationProps): UseYjsCollaborationReturn => {
  // Refs
  const yjsDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const cursorDisposableRef = useRef<{ dispose(): void } | null>(null);
  const isInitializedRef = useRef(false);

  // Store actions
  const { setConnectionStatus, addUser, removeUser, joinRoom, leaveRoom } = useCollaborationStore();

  // 정리 함수
  const cleanup = useCallback(() => {
    console.log('Yjs 연결 정리 중...');

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
    leaveRoom();
  }, [leaveRoom]);

  // 초기화 함수
  const initialize = useCallback(async () => {
    if (!editor || !roomId || !enabled || isInitializedRef.current) {
      return;
    }

    try {
      console.log('Yjs 협업 초기화 시작:', roomId);

      // 룸 참가
      joinRoom(roomId);

      // Yjs Document 생성
      const yjsDocument = new Y.Doc();
      yjsDocRef.current = yjsDocument;
      const yText = yjsDocument.getText('monaco-content');

      // WebSocket Provider 생성
      const wsUrl = getWebSocketUrl();
      console.log(`WebSocket 연결 시도: ${wsUrl}`);

      const provider = new WebsocketProvider(wsUrl, roomId, yjsDocument, {
        connect: true,
        maxBackoffTime: 2000,
      });
      providerRef.current = provider;

      // 현재 사용자 추가
      const currentUser = {
        id: userId,
        name: userName,
        color: '',
      };
      addUser(currentUser);

      // Monaco Editor 모델 가져오기
      const model = editor.getModel();
      if (!model) {
        throw new Error('Monaco Editor 모델을 찾을 수 없습니다.');
      }

      // Monaco 바인딩 생성
      const editorSet = new Set([editor]);
      const binding = new MonacoBinding(
        yText,
        model as never, // 타입 불일치 해결을 위한 never 캐스팅
        editorSet as never,
        provider.awareness
      );
      bindingRef.current = binding;

      // Awareness에 사용자 정보 설정
      setTimeout(() => {
        const { currentUser: updatedUser } = useCollaborationStore.getState();
        provider.awareness.setLocalStateField('user', updatedUser);
      }, 0);

      // Provider 상태 이벤트 핸들러
      provider.on('status', (event: { status: string }) => {
        console.log(`연결 상태 변경: ${event.status}`);
        const isConnected = event.status === 'connected';
        setConnectionStatus(isConnected);

        if (isConnected) {
          console.log('WebSocket 연결 성공');
        } else {
          console.log('WebSocket 연결 실패 또는 끊김');
        }
      });

      // Awareness 변경 이벤트 핸들러
      provider.awareness.on('change', () => {
        const states = provider.awareness.getStates();

        // 다른 사용자들의 상태 처리
        states.forEach((state: unknown, clientId: number) => {
          const typedState = state as {
            user?: {
              id: string;
              name: string;
              color: string;
            };
            cursor?: {
              line: number;
              column: number;
            };
          };

          if (clientId !== provider.awareness.clientID && typedState.user) {
            addUser({
              id: String(clientId),
              name: typedState.user.name,
              color: '',
              cursor: typedState.cursor,
            });
          }
        });

        // 비활성 사용자 제거
        const activeUserIds = new Set(
          Array.from(states.keys())
            .filter(id => id !== provider.awareness.clientID)
            .map(String)
        );

        const { users } = useCollaborationStore.getState();
        users.forEach(user => {
          if (!activeUserIds.has(user.id)) {
            removeUser(user.id);
          }
        });

        console.log(`현재 이 파일에 있는 사람 : ${states.size}명`);
      });

      // 커서 위치 변경 이벤트 핸들러
      const cursorDisposable = editor.onDidChangeCursorPosition(event => {
        const cursorPosition = {
          line: event.position.lineNumber,
          column: event.position.column,
        };

        provider.awareness.setLocalStateField('cursor', cursorPosition);

        const { currentUser } = useCollaborationStore.getState();
        if (currentUser.id) {
          useCollaborationStore.getState().updateUserCursor(currentUser.id, cursorPosition);
        }
      });
      cursorDisposableRef.current = cursorDisposable;

      isInitializedRef.current = true;
      console.log('Yjs 협업 초기화 완료');
    } catch (error) {
      console.error('Yjs 초기화 실패:', error);
      cleanup();
    }
  }, [
    editor,
    roomId,
    userId,
    userName,
    enabled,
    joinRoom,
    addUser,
    removeUser,
    setConnectionStatus,
    cleanup,
  ]);

  // 초기화 및 정리 Effect
  useEffect(() => {
    if (enabled && editor && roomId) {
      initialize().catch(console.error);
    }
    return cleanup;
  }, [enabled, editor, roomId, initialize, cleanup]);

  // 상태 계산
  const isConnected = Boolean(providerRef.current?.wsconnected);
  const isLoading = enabled && Boolean(roomId) && Boolean(editor) && !isInitializedRef.current;

  return {
    isConnected,
    isLoading,
    error: null,
  };
};
