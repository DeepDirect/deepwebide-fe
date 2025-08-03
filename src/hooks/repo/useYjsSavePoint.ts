import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface SavePointConnection {
  doc: Y.Doc;
  provider: WebsocketProvider;
  map: Y.Map<Record<string, unknown>>;
  activeUsers: Set<string>;
  cleanupTimer?: NodeJS.Timeout;
}

const savePointConnections = new Map<number, SavePointConnection>();

const cleanupSavePointConnection = (repositoryId: number) => {
  const connection = savePointConnections.get(repositoryId);
  if (!connection) return;

  console.log(`SavePoint 연결 정리: repository-${repositoryId}`);

  try {
    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
    }

    connection.provider.disconnect();
    connection.provider.destroy();
    connection.doc.destroy();
    savePointConnections.delete(repositoryId);

    console.log(`SavePoint 연결 정리 완료: repository-${repositoryId}`);
  } catch (error) {
    console.error(`SavePoint 연결 정리 실패: repository-${repositoryId}`, error);
  }
};

export function useYjsSavePoint(repositoryId: number) {
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [yMap, setYMap] = useState<Y.Map<Record<string, unknown>> | null>(null);

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
    let connection = savePointConnections.get(repositoryId);

    if (!connection) {
      const doc = new Y.Doc();
      const map = doc.getMap<Record<string, unknown>>('save-point');
      const wsUrl = import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
      const roomName = `savepoint-${repositoryId}`;

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

        console.log(`SavePoint 연결 상태: ${event.status} (repository-${repositoryId})`);
      });

      savePointConnections.set(repositoryId, connection);
      console.log(`새 SavePoint 연결 생성: repository-${repositoryId}`);
    }

    if (connection.cleanupTimer) {
      clearTimeout(connection.cleanupTimer);
      connection.cleanupTimer = undefined;
      console.log(`기존 SavePoint cleanup timer 취소: repository-${repositoryId}`);
    }

    connection.activeUsers.add(userId);

    if (mountedRef.current) {
      setYDoc(connection.doc);
      setProvider(connection.provider);
      setYMap(connection.map);
    }

    return () => {
      if (!connection) return;

      connection.activeUsers.delete(userId);

      if (connection.activeUsers.size === 0) {
        connection.cleanupTimer = setTimeout(() => {
          cleanupSavePointConnection(repositoryId);
        }, 60000);
        console.log(`SavePoint cleanup timer 설정: repository-${repositoryId} (60초)`);
      }

      if (mountedRef.current) {
        setYDoc(null);
        setProvider(null);
        setYMap(null);
      }
    };
  }, [repositoryId]);

  const syncHistoriesFromServer = useCallback(async () => {
    if (!yMap) return;

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/histories`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch histories: ${response.status}`);
      }

      const latestHistoriesResponse = await response.json();
      const latestHistories = latestHistoriesResponse.data || [];

      yMap.set('histories', latestHistories);
      yMap.set('lastUpdated', { value: Date.now() });

      console.log('SavePoint histories synced from server:', latestHistories.length);
    } catch (error) {
      console.error('Failed to sync histories from server:', error);
    }
  }, [repositoryId, yMap]);

  const broadcastHistoryUpdate = useCallback(
    (operation: string, data: unknown) => {
      if (!yMap || !provider) return;

      const operationData = {
        type: operation,
        data: data,
        timestamp: Date.now(),
        clientId: provider.awareness?.clientID,
      };

      yMap.set('lastOperation', operationData);

      if (operation === 'restore') {
        console.log('복원 이벤트 브로드캐스트:', {
          operation,
          timestamp: operationData.timestamp,
          repositoryId,
        });

        setTimeout(() => {
          yMap.set('forceRefresh', { value: Date.now() });
        }, 100);
      }
    },
    [yMap, provider, repositoryId]
  );

  return {
    yDoc,
    provider,
    yMap,
    syncHistoriesFromServer,
    broadcastHistoryUpdate,
  };
}
