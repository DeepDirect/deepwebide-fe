import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useCollaborationStore } from '@/stores/collaborationStore';
import type { CommandHistory } from '@/features/CodeRunner/types';

interface CodeRunnerCollaborationConfig {
  roomId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
}

interface CodeRunnerConnectionData {
  doc: Y.Doc;
  provider: WebsocketProvider;
  yArray: Y.Array<unknown>;
  activeUsers: Set<string>;
  cleanupTimer?: NodeJS.Timeout;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isDestroyed: boolean;
}

const codeRunnerConnections = new Map<string, CodeRunnerConnectionData>();

const getWebSocketUrl = (): string => {
  return import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
};

const cleanupCodeRunnerConnection = (roomId: string) => {
  const connection = codeRunnerConnections.get(roomId);
  if (!connection) return;

  console.log(`[CodeRunner] 연결 정리: ${roomId}`);

  try {
    connection.isDestroyed = true;

    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
    }

    connection.provider.disconnect();
    connection.provider.destroy();
    connection.doc.destroy();
    codeRunnerConnections.delete(roomId);

    console.log(`[CodeRunner] 연결 정리 완료: ${roomId}`);
  } catch (error) {
    console.error(`[CodeRunner] 연결 정리 실패: ${roomId}`, error);
  }
};

export const useYjsCodeRunner = ({
  roomId,
  userId,
  userName,
  enabled = true,
}: CodeRunnerCollaborationConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);

  const currentUserIdRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  const cleanupInProgressRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { setConnectionStatus, addUser, clearUsers } = useCollaborationStore();

  const cleanup = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    try {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const connection = codeRunnerConnections.get(roomId);
      if (connection && currentUserIdRef.current) {
        connection.isDestroyed = true;
        connection.activeUsers.delete(currentUserIdRef.current);
        console.log(
          `[CodeRunner] 사용자 제거: ${currentUserIdRef.current}, 남은 사용자: ${connection.activeUsers.size}`
        );

        if (connection.activeUsers.size === 0) {
          if (connection.cleanupTimer) {
            clearTimeout(connection.cleanupTimer);
          }

          connection.cleanupTimer = setTimeout(() => {
            cleanupCodeRunnerConnection(roomId);
          }, 60000);
          console.log(`[CodeRunner] cleanup timer 설정: ${roomId}`);
        }
      }

      setConnectionStatus(false);
      setIsConnected(false);
      setError(null);
      clearUsers();
      currentUserIdRef.current = '';
    } catch (cleanupError) {
      console.error(`[CodeRunner] 정리 중 오류: ${roomId}`, cleanupError);
    } finally {
      isInitializedRef.current = false;
      cleanupInProgressRef.current = false;
    }
  }, [roomId, setConnectionStatus, clearUsers]);

  const broadcastCommand = useCallback(
    (command: string, output: string, timestamp: Date) => {
      const connection = codeRunnerConnections.get(roomId);
      if (!connection || connection.isDestroyed) {
        console.warn(`[CodeRunner] 연결을 찾을 수 없거나 파괴됨: ${roomId}`);
        return;
      }

      const commandData = {
        id: `${userId}-${Date.now()}-${Math.random()}`,
        userId,
        userName,
        command,
        output,
        timestamp: timestamp.toISOString(),
        type: 'command',
      };

      console.log(`[CodeRunner] 명령어 브로드캐스트:`, commandData);

      try {
        connection.yArray.push([commandData]);
        console.log(`[CodeRunner] Y.Array 현재 길이: ${connection.yArray.length}`);
      } catch (error) {
        console.error(`[CodeRunner] 브로드캐스트 실패:`, error);
      }
    },
    [roomId, userId, userName]
  );

  const scheduleReconnect = useCallback(
    (connection: CodeRunnerConnectionData, delay: number = 3000) => {
      if (
        connection.isDestroyed ||
        connection.reconnectAttempts >= connection.maxReconnectAttempts
      ) {
        console.log(
          `[CodeRunner] 재연결 중단: ${roomId} (시도: ${connection.reconnectAttempts}/${connection.maxReconnectAttempts})`
        );
        setError('연결에 실패했습니다. 페이지를 새로고침해주세요.');
        return;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (
          !connection.isDestroyed &&
          connection.provider.shouldConnect &&
          !connection.provider.wsconnected
        ) {
          console.log(
            `[CodeRunner] 재연결 시도 ${connection.reconnectAttempts + 1}/${connection.maxReconnectAttempts}: ${roomId}`
          );
          connection.reconnectAttempts++;
          connection.provider.connect();
        }
      }, delay);
    },
    [roomId]
  );

  const initialize = useCallback(async () => {
    if (!roomId || !enabled || isInitializedRef.current || cleanupInProgressRef.current) {
      console.log(`[CodeRunner] 초기화 건너뛰기:`, {
        roomId,
        enabled,
        isInitialized: isInitializedRef.current,
      });
      return;
    }

    try {
      console.log(`[CodeRunner] 협업 초기화 시작: ${roomId}, 사용자: ${userId}(${userName})`);

      currentUserIdRef.current = userId;

      let connection = codeRunnerConnections.get(roomId);

      if (!connection) {
        const doc = new Y.Doc();
        const yArray = doc.getArray<unknown>('coderunner-commands');
        const wsUrl = getWebSocketUrl();
        const fullRoomId = `coderunner-${roomId}`;

        console.log(`[CodeRunner] 새 연결 생성: ${wsUrl}/${fullRoomId}`);

        const provider = new WebsocketProvider(wsUrl, fullRoomId, doc, {
          connect: true,
          maxBackoffTime: 30000,
          resyncInterval: 30000,
        });

        connection = {
          doc,
          provider,
          yArray,
          activeUsers: new Set<string>(),
          reconnectAttempts: 0,
          maxReconnectAttempts: 5,
          isDestroyed: false,
        };

        provider.on('status', (event: { status: string }) => {
          if (connection!.isDestroyed) return;

          const connected = event.status === 'connected';
          console.log(`[CodeRunner] WebSocket 상태 변경: ${event.status} (${roomId})`);

          setConnectionStatus(connected);
          setIsConnected(connected);

          if (connected) {
            setError(null);
            connection!.reconnectAttempts = 0;

            const currentUser = {
              id: userId,
              name: userName,
              color: '#' + Math.floor(Math.random() * 16777215).toString(16),
              lastSeen: Date.now(),
            };

            provider.awareness.setLocalStateField('user', currentUser);
            console.log(`[CodeRunner] Awareness 설정:`, currentUser);
          } else {
            if (event.status === 'disconnected' && !connection!.isDestroyed) {
              setError('연결이 끊어졌습니다. 재연결 중...');
              scheduleReconnect(connection!, 3000);
            }
          }
        });

        provider.on('connection-close', event => {
          if (connection!.isDestroyed) return;
          console.log(`[CodeRunner] WebSocket 연결 닫힘:`, event);

          if (event && (event.code === 1003 || event.code === 1008)) {
            console.log(`[CodeRunner] 서버에서 연결 거부됨 (코드: ${event.code})`);
            setError('서버에서 연결을 거부했습니다.');
            connection!.reconnectAttempts = connection!.maxReconnectAttempts;
          } else {
            scheduleReconnect(connection!, 5000);
          }
        });

        provider.on('connection-error', event => {
          if (connection!.isDestroyed) return;
          console.error(`[CodeRunner] WebSocket 연결 오류:`, event);
          setError('연결 오류가 발생했습니다.');
        });

        const handleAwarenessChange = () => {
          if (connection!.isDestroyed) return;

          try {
            const states = provider.awareness.getStates();
            console.log(`[CodeRunner] Awareness 변경, 총 클라이언트: ${states.size}`);

            clearUsers();

            for (const [clientId, state] of states.entries()) {
              const awarenessState = state as {
                user?: { id: string; name: string; color: string };
              };

              if (awarenessState.user && clientId !== provider.awareness.clientID) {
                const user = {
                  id: awarenessState.user.id,
                  name: awarenessState.user.name,
                  color: awarenessState.user.color,
                  lastSeen: Date.now(),
                };
                addUser(user);
                console.log(`[CodeRunner] 사용자 추가:`, user);
              }
            }
          } catch (awarenessError) {
            console.error('[CodeRunner] Awareness 처리 오류:', awarenessError);
          }
        };

        provider.awareness.on('change', handleAwarenessChange);

        const handleYArrayChange = () => {
          if (connection!.isDestroyed) return;

          try {
            const commands = connection!.yArray.toArray() as Array<{
              id: string;
              userId: string;
              userName: string;
              command: string;
              output: string;
              timestamp: string;
              type: string;
            }>;

            console.log(`[CodeRunner] Y.Array 변경, 총 명령어: ${commands.length}`);

            // 🔧 수정: 사용자 구분 로직 개선
            const formattedHistory: CommandHistory[] = commands.map(cmd => {
              console.log(`[CodeRunner] 명령어 처리:`, {
                cmdUserId: cmd.userId,
                currentUserId: userId,
                isCurrentUser: cmd.userId === userId,
                userName: cmd.userName,
                command: cmd.command,
              });

              return {
                command: cmd.command,
                // 🔧 모든 명령어에 사용자명 표시 (본인 명령어도 구분 가능하도록)
                output: `[${cmd.userName}] ${cmd.output}`,
                timestamp: new Date(cmd.timestamp),
              };
            });

            setCommandHistory(formattedHistory);
            console.log(`[CodeRunner] 명령어 히스토리 업데이트:`, formattedHistory.length);
          } catch (arrayError) {
            console.error('[CodeRunner] Array 변경 처리 오류:', arrayError);
          }
        };

        connection.yArray.observe(handleYArrayChange);
        codeRunnerConnections.set(roomId, connection);

        console.log(`[CodeRunner] 연결 맵에 저장: ${roomId}`);
      }

      if (connection.cleanupTimer) {
        clearTimeout(connection.cleanupTimer);
        connection.cleanupTimer = undefined;
        console.log(`[CodeRunner] 기존 cleanup timer 취소: ${roomId}`);
      }

      connection.activeUsers.add(userId);
      console.log(`[CodeRunner] 사용자 추가: ${userId}, 총 사용자: ${connection.activeUsers.size}`);

      const connected = connection.provider.wsconnected;
      setConnectionStatus(connected);
      setIsConnected(connected);

      if (connected) {
        const currentUser = {
          id: userId,
          name: userName,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          lastSeen: Date.now(),
        };
        connection.provider.awareness.setLocalStateField('user', currentUser);
      }

      isInitializedRef.current = true;
      console.log(`[CodeRunner] 협업 초기화 완료: ${roomId}`);
    } catch (initError) {
      console.error(`[CodeRunner] 초기화 실패: ${roomId}`, initError);
      setError('협업 모드 초기화에 실패했습니다.');
      cleanup();
    }
  }, [
    roomId,
    userId,
    userName,
    enabled,
    setConnectionStatus,
    addUser,
    clearUsers,
    cleanup,
    scheduleReconnect,
  ]);

  useEffect(() => {
    if (enabled && roomId && userId && userName) {
      console.log(`[CodeRunner] 초기화 트리거:`, { roomId, userId, userName, enabled });
      initialize();
    } else {
      console.log(`[CodeRunner] 초기화 조건 미충족:`, {
        enabled,
        roomId: !!roomId,
        userId: !!userId,
        userName: !!userName,
      });
    }

    return cleanup;
  }, [enabled, roomId, userId, userName, initialize, cleanup]);

  return {
    isConnected,
    error,
    commandHistory,
    broadcastCommand,
  };
};
