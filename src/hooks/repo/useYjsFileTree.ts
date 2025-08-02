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
        maxBackoffTime: 30000, // 30초로 증가
        resyncInterval: 30000, // 30초로 단축
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
        }, 60000); // 60초로 연장
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

  const updateFileTree = useCallback(
    (updates: Record<string, unknown>) => {
      if (!yMap) return;

      try {
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            yMap.set(key, value as Record<string, unknown>);
          }
        });
        console.log(`FileTree 업데이트: repository-${repositoryId}`, updates);
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

  return {
    yDoc,
    provider,
    yMap,
    connectionState,
    updateFileTree,
    getFileTreeData,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
  };
}
