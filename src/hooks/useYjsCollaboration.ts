import { useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCollaborationStore } from '@/stores/collaborationStore';

// 타입 정의 - Monaco Editor 관련
interface EditorInstance {
  getModel(): TextModel | null;
  onDidChangeCursorPosition(callback: (event: CursorChangeEvent) => void): unknown;
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

// Hook 관련 타입
interface UseYjsCollaborationProps {
  roomId: string;
  editor: EditorInstance | null;
  userId: string;
  userName: string;
  enabled?: boolean;
}

interface UseYjsCollaborationReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

// WebSocket URL 설정 함수
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
  const yjsDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const isInitializedRef = useRef(false);

  const { setConnectionStatus, addUser, removeUser, joinRoom, leaveRoom } = useCollaborationStore();

  const cleanup = useCallback(() => {
    console.log('Yjs 연결 정리 중...');

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }

    if (yjsDocRef.current) {
      yjsDocRef.current.destroy();
      yjsDocRef.current = null;
    }

    isInitializedRef.current = false;
    leaveRoom();
  }, [leaveRoom]);

  const initialize = useCallback(async () => {
    if (!editor || !roomId || !enabled || isInitializedRef.current) {
      return;
    }

    try {
      console.log('Yjs 협업 초기화 시작:', roomId);

      joinRoom(roomId);

      const yjsDocument = new Y.Doc();
      yjsDocRef.current = yjsDocument;
      const yText = yjsDocument.getText('monaco-content');

      const wsUrl = getWebSocketUrl();
      console.log(`WebSocket 연결 시도: ${wsUrl}`);

      const provider = new WebsocketProvider(wsUrl, roomId, yjsDocument, {
        connect: true,
        maxBackoffTime: 2000,
      });
      providerRef.current = provider;

      const currentUser = {
        id: userId,
        name: userName,
        color: '',
      };
      addUser(currentUser);

      const model = editor.getModel();
      if (!model) {
        throw new Error('Monaco Editor 모델을 찾을 수 없습니다.');
      }

      const editorSet = new Set([editor]);
      const binding = new MonacoBinding(
        yText,
        model as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        editorSet as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        provider.awareness
      );
      bindingRef.current = binding;

      setTimeout(() => {
        const { currentUser: updatedUser } = useCollaborationStore.getState();
        provider.awareness.setLocalStateField('user', updatedUser);
      }, 0);

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

      provider.awareness.on('change', () => {
        const states = provider.awareness.getStates();

        states.forEach(
          (
            state: {
              user?: {
                id: string;
                name: string;
                color: string;
              };
              cursor?: {
                line: number;
                column: number;
              };
            },
            clientId: number
          ) => {
            if (clientId !== provider.awareness.clientID && state.user) {
              addUser({
                id: String(clientId),
                name: state.user.name,
                color: '',
                cursor: state.cursor,
              });
            }
          }
        );

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

      editor.onDidChangeCursorPosition(event => {
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

  useEffect(() => {
    if (enabled && editor && roomId) {
      initialize().catch(console.error);
    }
    return cleanup;
  }, [enabled, editor, roomId, initialize, cleanup]);

  const isConnected = Boolean(providerRef.current?.wsconnected);
  const isLoading = enabled && Boolean(roomId) && Boolean(editor) && !isInitializedRef.current;

  return {
    isConnected,
    isLoading,
    error: null,
  };
};
