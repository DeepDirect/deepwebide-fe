import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useCollaborationStore, generateUserColor } from '@/stores/collaborationStore';
import { useTabStore } from '@/stores/tabStore';
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
  lastTabContent: string;
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
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 커서 위치 업데이트 방지를 위한 ref들
  const lastCursorPositionRef = useRef<{ line: number; column: number } | null>(null);
  const cursorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingCursorRef = useRef(false);

  const { setConnectionStatus, addUser, joinRoom, leaveRoom, setCurrentUser, clearUsers } =
    useCollaborationStore();
  const { openTabs, setTabContent, setTabDirty } = useTabStore();

  // 현재 활성 탭 찾기
  const activeTab = openTabs.find(tab => tab.isActive);

  const cleanup = useCallback(() => {
    if (cleanupInProgressRef.current) return;
    cleanupInProgressRef.current = true;

    try {
      // 커서 관련 타이머 정리
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
        cursorUpdateTimeoutRef.current = null;
      }

      // 동기화 타이머 정리
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }

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
          }, 60000);
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

      // ref 초기화
      lastCursorPositionRef.current = null;
      isUpdatingCursorRef.current = false;
    } catch (cleanupError) {
      console.error(`정리 중 오류: ${roomId}`, cleanupError);
    } finally {
      isInitializedRef.current = false;
      cleanupInProgressRef.current = false;
    }
  }, [roomId, leaveRoom, setConnectionStatus, clearUsers]);

  // 탭 내용을 Yjs로 동기화 (지연 적용으로 중복 방지)
  const syncTabContentToYjs = useCallback(
    (yjsContent: string) => {
      if (!activeTab || !setTabContent) return;

      // 기존 타이머 클리어
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // 100ms 지연으로 중복 업데이트 방지
      syncTimeoutRef.current = setTimeout(() => {
        const currentTabContent = activeTab.content || '';

        // 내용이 실제로 다를 때만 업데이트
        if (yjsContent !== currentTabContent) {
          console.log('Yjs → Tab 동기화:', {
            roomId,
            tabId: activeTab.id,
            yjsLength: yjsContent.length,
            tabLength: currentTabContent.length,
          });

          setTabContent(activeTab.id, yjsContent);
          setTabDirty(activeTab.id, false); // Yjs 동기화는 clean 상태
        }
      }, 100);
    },
    [activeTab, setTabContent, setTabDirty, roomId]
  );

  // 안전한 커서 위치 업데이트 함수
  const updateCursorPosition = useCallback(
    (newPosition: { line: number; column: number }) => {
      // 이미 업데이트 중이면 건너뛰기
      if (isUpdatingCursorRef.current) {
        return;
      }

      // 이전 위치와 동일하면 건너뛰기
      const lastPosition = lastCursorPositionRef.current;
      if (
        lastPosition &&
        lastPosition.line === newPosition.line &&
        lastPosition.column === newPosition.column
      ) {
        return;
      }

      // 기존 타이머 클리어
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }

      // 디바운싱으로 무한 루프 방지 (50ms)
      cursorUpdateTimeoutRef.current = setTimeout(() => {
        try {
          isUpdatingCursorRef.current = true;

          const connection = connections.get(roomId);
          if (!connection) return;

          // awareness 업데이트
          connection.provider.awareness.setLocalStateField('cursor', newPosition);
          lastCursorPositionRef.current = newPosition;

          console.log('커서 위치 업데이트:', {
            roomId,
            position: newPosition,
          });
        } catch (cursorError) {
          console.error('커서 위치 업데이트 중 오류:', cursorError);
        } finally {
          // 100ms 후에 업데이트 플래그 해제 (데코레이션 업데이트 완료 대기)
          setTimeout(() => {
            isUpdatingCursorRef.current = false;
          }, 100);
        }
      }, 50);
    },
    [roomId]
  );

  const initialize = useCallback(async () => {
    if (
      !editor ||
      !roomId ||
      !enabled ||
      isInitializedRef.current ||
      cleanupInProgressRef.current ||
      !activeTab
    ) {
      return;
    }

    try {
      console.log(`협업 초기화 시작: ${roomId}`);

      const model = editor.getModel();
      if (!model) {
        throw new Error('Monaco Editor 모델을 찾을 수 없습니다.');
      }

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
          maxBackoffTime: 30000,
          resyncInterval: 30000,
        });

        connection = {
          doc,
          provider,
          yText,
          activeUsers: new Set<string>(),
          isContentInitialized: false,
          lastTabContent: '',
        };

        provider.on('status', (event: { status: string }) => {
          const connected = event.status === 'connected';
          setConnectionStatus(connected);
          setIsConnected(connected);

          if (connected) {
            console.log(`WebSocket 연결 성공: ${roomId}`);
            setError(null);
            provider.awareness.setLocalStateField('user', currentUser);

            // 연결 성공 후 내용 동기화
            setTimeout(() => {
              syncInitialContent();
            }, 200);
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
              }, 2000);
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
        if (!connection || connection.isContentInitialized) {
          console.log('동기화 건너뛰기: 이미 초기화됨', { roomId });
          return;
        }

        const currentYjsContent = connection.yText.toString();
        const currentTabContent = activeTab.content || '';

        console.log(`초기 내용 동기화: ${roomId}`, {
          yjsLength: currentYjsContent.length,
          tabLength: currentTabContent.length,
          lastTabContent: connection.lastTabContent,
        });

        // 중복 동기화 방지
        if (connection.lastTabContent === currentTabContent && currentYjsContent.length > 0) {
          console.log('중복 동기화 방지:', { roomId });
          connection.isContentInitialized = true;
          return;
        }

        if (currentYjsContent.length === 0 && currentTabContent.length > 0) {
          // Yjs가 비어있고 탭에 내용이 있으면 → 탭 내용을 Yjs로
          console.log('탭 → Yjs 동기화 (새 문서)');
          connection.yText.insert(0, currentTabContent);
          connection.lastTabContent = currentTabContent;
        } else if (currentYjsContent.length > 0 && currentYjsContent !== currentTabContent) {
          // Yjs에 내용이 있고 탭과 다르면 → Yjs 내용을 탭으로
          console.log('Yjs → 탭 동기화 (기존 문서)');
          model.setValue(currentYjsContent);
          syncTabContentToYjs(currentYjsContent);
          connection.lastTabContent = currentYjsContent;
        } else {
          // 둘 다 비어있거나 동일하면 현재 상태 유지
          console.log('동기화 불필요 (빈 문서 또는 동일한 내용)');
          connection.lastTabContent = currentTabContent;
        }

        connection.isContentInitialized = true;
      };

      // Monaco Binding 설정
      const editorSet = new Set([editor]);
      const binding = new MonacoBinding(
        connection.yText,
        model as never,
        editorSet as never,
        connection.provider.awareness
      ) as MonacoBindingType;

      bindingRef.current = binding;

      // Yjs 내용 변경 시 탭 동기화
      const handleYjsChange = () => {
        if (connection && connection.isContentInitialized) {
          const newContent = connection.yText.toString();
          if (newContent !== connection.lastTabContent) {
            syncTabContentToYjs(newContent);
            connection.lastTabContent = newContent;
          }
        }
      };

      connection.yText.observe(handleYjsChange);

      // 안전한 커서 위치 추적
      const handleCursorChange = (event: { position: { lineNumber: number; column: number } }) => {
        // MonacoBinding에 의한 업데이트 중이면 건너뛰기
        if (isUpdatingCursorRef.current) {
          return;
        }

        const cursorPosition = {
          line: event.position.lineNumber,
          column: event.position.column,
        };

        updateCursorPosition(cursorPosition);
      };

      const cursorDisposable = editor.onDidChangeCursorPosition(handleCursorChange);
      cursorDisposableRef.current = cursorDisposable;

      const connected = connection.provider.wsconnected;
      setConnectionStatus(connected);
      setIsConnected(connected);

      if (connected) {
        // 초기 사용자 정보만 설정 (커서는 실제 변경시에만)
        connection.provider.awareness.setLocalStateField('user', currentUser);
        setTimeout(syncInitialContent, 200);
      }

      isInitializedRef.current = true;
      console.log(`협업 초기화 완료: ${roomId}`);
    } catch (initError) {
      console.error(`초기화 실패: ${roomId}`, initError);
      setError('협업 모드 초기화에 실패했습니다.');
      cleanup();
    }
  }, [
    editor,
    roomId,
    userId,
    userName,
    enabled,
    activeTab,
    joinRoom,
    setCurrentUser,
    setConnectionStatus,
    addUser,
    clearUsers,
    cleanup,
    syncTabContentToYjs,
    updateCursorPosition,
  ]);

  useEffect(() => {
    if (enabled && editor && roomId && userId && userName && activeTab) {
      initialize();
    }

    return cleanup;
  }, [enabled, editor, roomId, userId, userName, activeTab?.id, initialize, cleanup]);

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
