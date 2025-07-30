import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// 전역(모듈 스코프)에서 싱글턴 객체로 관리
const yDocMap = new Map<number, Y.Doc>();
const providerMap = new Map<number, WebsocketProvider>();
const yMapMap = new Map<number, Y.Map<Record<string, unknown>>>();

export function useYjsFileTree(repositoryId: number) {
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
      provider = new WebsocketProvider(
        import.meta.env.VITE_YJS_WEBSOCKET_URL || 'ws://localhost:1234',
        `filetree-${repositoryId}`,
        yDoc
      );
      providerMap.set(repositoryId, provider);
    }

    if (!yMap) {
      yMap = yDoc.getMap<Record<string, unknown>>('file-tree');
      yMapMap.set(repositoryId, yMap);
    }

    setYDoc(yDoc);
    setProvider(provider);
    setYMap(yMap);

    // 클린업 시 실제 Yjs 인스턴스 파괴 X (다른 컴포넌트가 공유중일 수 있음)
    return () => {
      setProvider(null);
      setYDoc(null);
      setYMap(null);
    };
  }, [repositoryId]);

  // API 호출 후 서버에서 최신 파일트리를 가져와서 YJS에 동기화
  const syncFileTreeFromServer = useCallback(async () => {
    if (!yMap) return;

    try {
      // 서버에서 최신 파일트리 가져오기
      const response = await fetch(`/api/repository/${repositoryId}/filetree`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file tree: ${response.status}`);
      }

      const latestFileTree = await response.json();

      // YJS Map에 최신 데이터 적용하여 다른 클라이언트에게 전파
      yMap.set('fileTree', latestFileTree);
      yMap.set('lastUpdated', { value: Date.now() });

      console.log('File tree synced from server:', latestFileTree);
    } catch (error) {
      console.error('Failed to sync file tree from server:', error);
    }
  }, [repositoryId, yMap]);

  // 다른 클라이언트들에게 파일트리 업데이트 알림
  const broadcastFileTreeUpdate = useCallback(
    (operation: string, data: unknown) => {
      if (!yMap || !provider) return;

      // 작업 정보를 YJS에 저장하여 다른 클라이언트에게 알림
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
    syncFileTreeFromServer,
    broadcastFileTreeUpdate,
  };
}
