import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 전역 관리 객체들
const yDocMap = new Map<number, Y.Doc>();
const providerMap = new Map<number, WebsocketProvider>();
const yMapMap = new Map<number, Y.Map<Record<string, unknown>>>();

export function useYjsSavePoint(repositoryId: number) {
  const [yDoc, setYDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [yMap, setYMap] = useState<Y.Map<Record<string, unknown>> | null>(null);

  useEffect(() => {
    if (!repositoryId) return;

    let yDoc = yDocMap.get(repositoryId);
    let provider = providerMap.get(repositoryId);
    let yMap = yMapMap.get(repositoryId);

    if (!yDoc) {
      yDoc = new Y.Doc();
      yDocMap.set(repositoryId, yDoc);
    }

    if (!provider) {
      // WebSocket URL을 환경변수에서 가져오기
      const wsUrl = import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234';
      provider = new WebsocketProvider(
        wsUrl,
        `savepoint-${repositoryId}`, // YJS 서버가 인식할 수 있는 룸 이름
        yDoc
      );
      providerMap.set(repositoryId, provider);
    }

    if (!yMap) {
      yMap = yDoc.getMap<Record<string, unknown>>('save-point');
      yMapMap.set(repositoryId, yMap);
    }

    setYDoc(yDoc);
    setProvider(provider);
    setYMap(yMap);

    return () => {
      setProvider(null);
      setYDoc(null);
      setYMap(null);
    };
  }, [repositoryId]);

  // API에서 최신 히스토리를 가져와서 YJS에 동기화
  const syncHistoriesFromServer = useCallback(async () => {
    if (!yMap) return;

    try {
      // 기존 API 클라이언트 사용
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

      // YJS Map에 최신 데이터 적용
      yMap.set('histories', latestHistories);
      yMap.set('lastUpdated', { value: Date.now() });

      console.log('SavePoint histories synced from server:', latestHistories.length);
    } catch (error) {
      console.error('Failed to sync histories from server:', error);
    }
  }, [repositoryId, yMap]);

  // 다른 클라이언트들에게 히스토리 업데이트 알림
  const broadcastHistoryUpdate = useCallback(
    (operation: string, data: unknown) => {
      if (!yMap || !provider) return;

      yMap.set('lastOperation', {
        type: operation,
        data: data,
        timestamp: Date.now(),
        clientId: provider.awareness?.clientID,
      });
    },
    [yMap, provider]
  );

  return {
    yDoc,
    provider,
    yMap,
    syncHistoriesFromServer,
    broadcastHistoryUpdate,
  };
}
