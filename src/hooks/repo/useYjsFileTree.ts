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
        resyncInterval: 120000,
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
            break;
          case 'disconnected':
            setConnectionState('disconnected');
            break;
        }
      });

      provider.on('connection-error', () => {
        if (mountedRef.current) {
          console.error(`FileTree 연결 오류 (repository-${repositoryId})`);
          setConnectionState('disconnected');
        }
      });

      provider.on('connection-close', () => {
        if (mountedRef.current) {
          console.log(`FileTree 연결 해제 (repository-${repositoryId})`);
          setConnectionState('disconnected');
        }
      });

      fileTreeConnections.set(repositoryId, connection);
      console.log(`FileTree 새 연결 생성: ${roomName}`);
    }

    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
      connection.cleanupTimer = undefined;
    }

    connection.activeUsers.add(userId);

    setYDoc(connection.doc);
    setProvider(connection.provider);
    setYMap(connection.map);

    const isConnected = connection.provider.wsconnected;
    if (mountedRef.current) {
      setConnectionState(isConnected ? 'connected' : 'connecting');
    }

    console.log(
      `FileTree 사용자 추가: repository-${repositoryId} (${connection.activeUsers.size}명)`
    );

    return () => {
      if (!connection) return;

      connection.activeUsers.delete(userId);
      console.log(
        `FileTree 사용자 제거: repository-${repositoryId} (${connection.activeUsers.size}명)`
      );

      if (connection.activeUsers.size === 0) {
        if (connection.cleanupTimer) {
          clearTimeout(connection.cleanupTimer);
        }

        connection.cleanupTimer = setTimeout(() => {
          cleanupFileTreeConnection(repositoryId);
        }, 3000);
      }

      if (mountedRef.current) {
        setProvider(null);
        setYDoc(null);
        setYMap(null);
        setConnectionState('disconnected');
      }
    };
  }, [repositoryId]);

  const syncFileTreeFromServer = useCallback(async () => {
    if (!yMap || connectionState !== 'connected') {
      console.warn(
        `FileTree 동기화 스킵: repository-${repositoryId} (연결상태: ${connectionState})`
      );
      return;
    }

    try {
      const response = await fetch(`/api/repository/${repositoryId}/filetree`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file tree: ${response.status}`);
      }

      const latestFileTree = await response.json();

      yMap.set('fileTree', latestFileTree);
      yMap.set('lastUpdated', { value: Date.now() });

      console.log(`FileTree 서버 동기화 완료: repository-${repositoryId}`);
    } catch (error) {
      console.error(`FileTree 서버 동기화 실패: repository-${repositoryId}`, error);
    }
  }, [repositoryId, yMap, connectionState]);

  const broadcastFileTreeUpdate = useCallback(
    (operation: string, data: unknown) => {
      if (!yMap || !provider || connectionState !== 'connected') {
        console.warn(
          `FileTree 브로드캐스트 스킵: repository-${repositoryId} (연결상태: ${connectionState})`
        );
        return;
      }

      try {
        yMap.set('lastOperation', {
          type: operation,
          data: data,
          timestamp: Date.now(),
          clientId: provider.awareness?.clientID,
        });

        console.log(`FileTree 브로드캐스트: repository-${repositoryId}`, { operation });
      } catch (error) {
        console.error(`FileTree 브로드캐스트 실패: repository-${repositoryId}`, error);
      }
    },
    [yMap, provider, repositoryId, connectionState]
  );

  return {
    yDoc,
    provider,
    yMap,
    connectionState,
    syncFileTreeFromServer,
    broadcastFileTreeUpdate,
  };
}

export const getYjsFileTreeStatus = () => {
  return {
    activeConnections: Array.from(fileTreeConnections.entries()).map(([repoId, conn]) => ({
      repositoryId: repoId,
      userCount: conn.activeUsers.size,
      isConnected: conn.provider.wsconnected,
    })),
    totalConnections: fileTreeConnections.size,
  };
};
