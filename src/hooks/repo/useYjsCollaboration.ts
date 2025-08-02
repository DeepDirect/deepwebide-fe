import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCollaborationStore, generateUserColor } from '@/stores/collaborationStore';
import type {
  YjsCollaborationConfig,
  YjsCollaborationReturn,
  MonacoBindingType,
  Disposable,
} from '@/types/repo/yjs.types';

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

interface ConnectionData {
  doc: Y.Doc;
  provider: WebsocketProvider;
  yText: Y.Text;
  activeUsers: Set<string>;
  isContentInitialized: boolean;
  cleanupTimer?: NodeJS.Timeout;
}

const connections = new Map<string, ConnectionData>();

const getWebSocketUrl = (): string => {
  return import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
};

const cleanupConnection = (roomId: string) => {
  const connection = connections.get(roomId);
  if (!connection) return;

  console.log(`연결 정리 시작: ${roomId}`);

  try {
    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
    }

    connection.provider.disconnect();
    connection.provider.destroy();
    connection.doc.destroy();
    connections.delete(roomId);

    console.log(`연결 정리 완료: ${roomId}`);
  } catch (error) {
    console.error(`연결 정리 실패: ${roomId}`, error);
  }
};

export const useYjsCollaboration = ({
  roomId,
  editor,
  userId,
  userName,
  enabled = true,
}: YjsCollaborationConfig): YjsCollaborationReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const bindingRef = useRef<MonacoBindingType | null>(null);
  const cursorDisposableRef = useRef<Disposable | null>(null);
  const currentUserIdRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const initialContentRef = useRef<string>('');

  const { setConnectionStatus, addUser, joinRoom, leaveRoom, setCurrentUser, clearUsers } =
    useCollaborationStore();

  const cleanup = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    try {
      if (cursorDisposableRef.current) {
        cursorDisposableRef.current.dispose();
        cursorDisposableRef.current = null;
      }

      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      const connection = connections.get(roomId);
      if (connection && currentUserIdRef.current) {
        connection.activeUsers.delete(currentUserIdRef.current);

        if (connection.activeUsers.size === 0) {
          if (connection.cleanupTimer) {
            clearTimeout(connection.cleanupTimer);
          }

          connection.cleanupTimer = setTimeout(() => {
            cleanupConnection(roomId);
          }, 60000); // 60초로 연장햇슴다
        }
      }

      if (roomId) {
        leaveRoom();
      }

      setConnectionStatus(false);
      setIsConnected(false);
      setError(null);
      clearUsers();
      currentUserIdRef.current = '';
      initialContentRef.current = '';
    } catch (cleanupError) {
      console.error(`정리 중 오류: ${roomId}`, cleanupError);
    } finally {
      isInitializedRef.current = false;
      cleanupInProgressRef.current = false;
    }
  }, [roomId, leaveRoom, setConnectionStatus, clearUsers]);

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
      console.log(`협업 초기화 시작: ${roomId}`);

      const model = editor.getModel();
      if (!model) {
        throw new Error('Monaco Editor 모델을 찾을 수 없습니다.');
      }

      initialContentRef.current = model.getValue();

      const currentUser = {
        id: userId,
        name: userName,
        color: generateUserColor(userId),
        lastSeen: Date.now(),
      };

      setCurrentUser(currentUser);
      joinRoom(roomId);
      currentUserIdRef.current = userId;

      let connection = connections.get(roomId);

      if (!connection) {
        const doc = new Y.Doc();
        const yText = doc.getText('monaco-content');
        const wsUrl = getWebSocketUrl();

        const provider = new WebsocketProvider(wsUrl, roomId, doc, {
          connect: true,
          maxBackoffTime: 30000, // 5초 → 30초로 증가
          resyncInterval: 30000, // 60초 → 30초로 단축
        });

        connection = {
          doc,
          provider,
          yText,
          activeUsers: new Set<string>(),
          isContentInitialized: false,
        };

        provider.on('status', (event: { status: string }) => {
          const connected = event.status === 'connected';
          setConnectionStatus(connected);
          setIsConnected(connected);

          if (connected) {
            console.log(`WebSocket 연결 성공: ${roomId}`);
            setError(null);
            provider.awareness.setLocalStateField('user', currentUser);

            setTimeout(() => {
              syncInitialContent();
            }, 100);
          } else {
            if (event.status === 'disconnected') {
              console.log(`WebSocket 연결 끊김: ${roomId}`);
              setError('연결이 끊어졌습니다. 재연결 시도 중...');

              setTimeout(() => {
                try {
                  if (provider.shouldConnect && !provider.wsconnected) {
                    console.log(`재연결 시도: ${roomId}`);
                    provider.connect();
                  }
                } catch (reconnectError) {
                  console.error(`재연결 실패: ${roomId}`, reconnectError);
                }
              }, 2000); // 2초 후 재연결 시도
            } else if (event.status === 'connecting') {
              console.log(`WebSocket 연결 중: ${roomId}`);
              setError('연결 중...');
            }
          }
        });

        const handleAwarenessChange = () => {
          try {
            const states = provider.awareness.getStates();
            clearUsers();

            for (const [clientId, state] of states.entries()) {
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
        };

        provider.awareness.on('change', handleAwarenessChange);
        connections.set(roomId, connection);
        console.log(`새 연결 생성: ${roomId}`);
      }

      if (connection.cleanupTimer) {
        clearTimeout(connection.cleanupTimer);
        connection.cleanupTimer = undefined;
        console.log(`기존 cleanup timer 취소: ${roomId}`);
      }

      connection.activeUsers.add(userId);

      const syncInitialContent = () => {
        if (!connection || connection.isContentInitialized) return;

        const currentYjsContent = connection.yText.toString();
        console.log(`초기 내용 동기화: ${roomId}`, {
          yjsLength: currentYjsContent.length,
          initialLength: initialContentRef.current.length,
        });

        if (currentYjsContent.length === 0 && initialContentRef.current.length > 0) {
          console.log('새 내용을 Yjs에 설정');
          model.setValue('');
          connection.yText.insert(0, initialContentRef.current);
        } else if (currentYjsContent.length > 0) {
          console.log('기존 Yjs 내용 적용');
          model.setValue('');
        } else {
          console.log('빈 문서로 시작');
          model.setValue('');
        }

        connection.isContentInitialized = true;
      };

      const editorSet = new Set([editor]);
      const binding = new MonacoBinding(
        connection.yText,
        model as never,
        editorSet as never,
        connection.provider.awareness
      ) as MonacoBindingType;

      bindingRef.current = binding;

      const handleCursorChange = (event: { position: { lineNumber: number; column: number } }) => {
        try {
          const cursorPosition = {
            line: event.position.lineNumber,
            column: event.position.column,
          };
          connection.provider.awareness.setLocalStateField('cursor', cursorPosition);
        } catch (cursorError) {
          console.error('커서 위치 업데이트 중 오류:', cursorError);
        }
      };

      const cursorDisposable = editor.onDidChangeCursorPosition(handleCursorChange);
      cursorDisposableRef.current = cursorDisposable;

      const connected = connection.provider.wsconnected;
      setConnectionStatus(connected);
      setIsConnected(connected);

      if (connected) {
        connection.provider.awareness.setLocalStateField('user', currentUser);
        setTimeout(syncInitialContent, 100);
      }

      isInitializedRef.current = true;
      console.log(`협업 초기화 완료: ${roomId}`);
    } catch (initError) {
      console.error(`초기화 실패: ${roomId}`, initError);
      setError('초기화에 실패했습니다.');
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
    addUser,
    clearUsers,
    cleanup,
  ]);

  useEffect(() => {
    if (enabled && editor && roomId && userId && userName) {
      initialize();
    }

    return cleanup;
  }, [enabled, editor, roomId, userId, userName, initialize, cleanup]);

  const connection = connections.get(roomId);
  const isLoading =
    enabled && Boolean(roomId) && Boolean(editor) && !isInitializedRef.current && !error;

  return {
    isConnected: isConnected || Boolean(connection?.provider?.wsconnected),
    isLoading,
    error,
  };
};

export const getGlobalYjsStatus = () => {
  return {
    activeConnections: Array.from(connections.entries()).map(([roomId, conn]) => ({
      roomId,
      userCount: conn.activeUsers.size,
      isConnected: conn.provider.wsconnected,
      isContentInitialized: conn.isContentInitialized,
    })),
    totalConnections: connections.size,
  };
};
