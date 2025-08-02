import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface FileTreeConnection {
  doc: Y.Doc;
  provider: WebsocketProvider;
  map: Y.Map<Record<string, unknown>>;
  activeUsers: Set<string>;
  cleanupTimer?: NodeJS.Timeout;
}

const fileTreeConnections = new Map<number, FileTreeConnection>();

const cleanupFileTreeConnection = (repositoryId: number) => {
  const connection = fileTreeConnections.get(repositoryId);
  if (!connection) return;

  console.log(`FileTree 연결 정리: repository-${repositoryId}`);

  try {
    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
    }

    connection.provider.disconnect();
    connection.provider.destroy();
    connection.doc.destroy();
    fileTreeConnections.delete(repositoryId);

    console.log(`FileTree 연결 정리 완료: repository-${repositoryId}`);
  } catch (error) {
    console.error(`FileTree 연결 정리 실패: repository-${repositoryId}`, error);
  }
};

export function useYjsFileTree(repositoryId: number) {
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [yMap, setYMap] = useState<Y.Map<Record<string, unknown>> | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');

  const userIdRef = useRef<string>(
    `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!repositoryId) return;

    const userId = userIdRef.current;
    let connection = fileTreeConnections.get(repositoryId);

    if (!connection) {
      const doc = new Y.Doc();
      const map = doc.getMap<Record<string, unknown>>('file-tree');
      const wsUrl = import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
      const roomName = `filetree-${repositoryId}`;

      const provider = new WebsocketProvider(wsUrl, roomName, doc, {
        connect: true,
        maxBackoffTime: 30000,
        resyncInterval: 30000,
      });

      connection = {
        doc,
        provider,
        map,
        activeUsers: new Set<string>(),
      };

      provider.on('status', (event: { status: string }) => {
        if (!mountedRef.current) return;

        console.log(`FileTree 연결 상태: ${event.status} (repository-${repositoryId})`);

        switch (event.status) {
          case 'connecting':
            setConnectionState('connecting');
            break;
          case 'connected':
            setConnectionState('connected');
            console.log(`FileTree WebSocket 연결 성공: repository-${repositoryId}`);
            break;
          case 'disconnected':
            setConnectionState('disconnected');
            console.log(`FileTree WebSocket 연결 끊김: repository-${repositoryId}`);

            setTimeout(() => {
              if (provider.shouldConnect && !provider.wsconnected) {
                console.log(`FileTree 재연결 시도: repository-${repositoryId}`);
                provider.connect();
              }
            }, 3000);
            break;
        }
      });

      fileTreeConnections.set(repositoryId, connection);
      console.log(`새 FileTree 연결 생성: repository-${repositoryId}`);
    }

    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
      connection.cleanupTimer = undefined;
      console.log(`기존 FileTree cleanup timer 취소: repository-${repositoryId}`);
    }

    connection.activeUsers.add(userId);

    if (mountedRef.current) {
      setYDoc(connection.doc);
      setProvider(connection.provider);
      setYMap(connection.map);
      setConnectionState(connection.provider.wsconnected ? 'connected' : 'disconnected');
    }

    return () => {
      if (!connection) return;

      connection.activeUsers.delete(userId);

      if (connection.activeUsers.size === 0) {
        connection.cleanupTimer = setTimeout(() => {
          cleanupFileTreeConnection(repositoryId);
        }, 60000);
        console.log(`FileTree cleanup timer 설정: repository-${repositoryId} (60초)`);
      }

      if (mountedRef.current) {
        setYDoc(null);
        setProvider(null);
        setYMap(null);
        setConnectionState('disconnected');
      }
    };
  }, [repositoryId]);

  // 파일트리 브로드캐스트 함수 - 서버 형식에 맞게 수정
  const broadcastFileTreeUpdate = useCallback(
    (action: 'create' | 'delete' | 'rename' | 'move' | 'upload', data: Record<string, unknown>) => {
      if (!provider || !provider.ws || provider.ws.readyState !== WebSocket.OPEN) {
        console.warn('YJS WebSocket 연결이 없어 파일트리 브로드캐스트 건너뜀');
        return;
      }

      // 서버에서 처리할 수 있는 형식으로 메시지 구성
      const message = {
        type: 'fileTree',
        action,
        data: {
          ...data,
          repositoryId,
        },
        timestamp: Date.now(),
        repositoryId,
      };

      try {
        // WebSocket을 통해 서버로 메시지 전송
        provider.ws.send(JSON.stringify(message));
        console.log(`파일트리 브로드캐스트 전송:`, {
          action,
          repositoryId,
          dataKeys: Object.keys(data),
        });

        // YJS Map에도 업데이트 정보 저장 (로컬 상태)
        if (yMap) {
          yMap.set('lastAction', { value: action });
          yMap.set('lastUpdate', data);
          yMap.set('lastTimestamp', { value: Date.now() });
        }
      } catch (error) {
        console.error('파일트리 브로드캐스트 실패:', error);
      }
    },
    [provider, yMap, repositoryId]
  );

  // 파일트리 메시지 수신 처리 개선
  useEffect(() => {
    if (!provider || !provider.ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        let message;

        // 메시지가 이미 객체인지 문자열인지 확인
        if (typeof event.data === 'string') {
          message = JSON.parse(event.data);
        } else {
          // Yjs 바이너리 메시지는 무시
          return;
        }

        // 파일트리 메시지만 처리
        if (message.type === 'fileTree' && message.repositoryId === repositoryId) {
          console.log(`파일트리 업데이트 수신:`, {
            action: message.action,
            timestamp: message.timestamp,
            hasData: !!message.data,
          });

          // YJS Map에 수신된 업데이트 정보 저장
          if (yMap) {
            yMap.set('receivedAction', { value: message.action });
            yMap.set('receivedData', message.data);
            yMap.set('receivedTimestamp', { value: message.timestamp });
            yMap.set('needsRefresh', { value: true }); // 새로고침 필요 플래그
          }
        }
      } catch {
        // JSON 파싱 실패는 정상 (Yjs 바이너리 메시지)
        // console.debug('메시지 파싱 실패 (정상)');
      }
    };

    provider.ws.addEventListener('message', handleMessage);

    return () => {
      if (provider.ws) {
        provider.ws.removeEventListener('message', handleMessage);
      }
    };
  }, [provider, yMap, repositoryId]);

  const updateFileTree = useCallback(
    (updates: Record<string, unknown>) => {
      if (!yMap) return;

      try {
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            yMap.set(key, value as Record<string, unknown>);
          }
        });
        console.log(`FileTree 업데이트: repository-${repositoryId}`, Object.keys(updates));
      } catch (error) {
        console.error(`FileTree 업데이트 실패: repository-${repositoryId}`, error);
      }
    },
    [yMap, repositoryId]
  );

  const getFileTreeData = useCallback(() => {
    if (!yMap) return {};

    try {
      const data = yMap.toJSON();
      return data as Record<string, unknown>;
    } catch (error) {
      console.error(`FileTree 데이터 조회 실패: repository-${repositoryId}`, error);
      return {};
    }
  }, [yMap, repositoryId]);

  // 새로고침 필요 여부 확인
  const needsRefresh = useCallback(() => {
    if (!yMap) return false;
    const refreshFlag = yMap.get('needsRefresh') as { value: boolean } | undefined;
    return refreshFlag?.value === true;
  }, [yMap]);

  // 새로고침 플래그 초기화
  const clearRefreshFlag = useCallback(() => {
    if (!yMap) return;
    yMap.set('needsRefresh', { value: false });
  }, [yMap]);

  return {
    yDoc,
    provider,
    yMap,
    connectionState,
    updateFileTree,
    getFileTreeData,
    broadcastFileTreeUpdate,
    needsRefresh,
    clearRefreshFlag,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
  };
}
