import { useState, useEffect } from 'react';
import { useHistoriesQuery } from './useSavePointApi';
import { useYjsSavePoint } from '@/hooks/repo/useYjsSavePoint';
import type { HistoryItem } from '../types';

interface UseSavePointParams {
  repositoryId: string;
}

interface UseSavePointResult {
  histories: HistoryItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useSavePoint = ({ repositoryId }: UseSavePointParams): UseSavePointResult => {
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [yjsError, setYjsError] = useState<Error | null>(null);

  const repositoryIdNumber = parseInt(repositoryId, 10);

  // API (최초 1회만 사용 + 서버 동기화 유지)
  const {
    data: apiResponse,
    isLoading: isApiLoading,
    error: apiError,
    refetch,
  } = useHistoriesQuery(repositoryId);

  // Yjs 연결
  const { yMap, provider } = useYjsSavePoint(repositoryIdNumber);

  // 1. YMap -> histories 실시간 반영
  useEffect(() => {
    if (!yMap) return;

    const syncHistories = () => {
      const yjsHistories = yMap.get('histories');
      if (yjsHistories && Array.isArray(yjsHistories)) {
        setHistories(yjsHistories as HistoryItem[]);
        console.log('🔄 YJS에서 히스토리 동기화:', yjsHistories.length, '개');
      }
    };

    syncHistories();
    yMap.observe(syncHistories);

    return () => yMap.unobserve(syncHistories);
  }, [yMap]);

  // 2. API 변경 감지 시 YMap에 반영 (YMap이 비었거나, 최신 히스토리와 다를 때만)
  useEffect(() => {
    if (!yMap || !apiResponse?.data?.data) return;

    const apiHistories = apiResponse.data.data;
    const currentYjsHistories = yMap.get('histories') as HistoryItem[] | undefined;

    // 데이터 비교 (히스토리 개수나 최신 항목의 ID가 다른 경우)
    const isDifferent =
      !currentYjsHistories ||
      currentYjsHistories.length !== apiHistories.length ||
      (apiHistories.length > 0 &&
        currentYjsHistories.length > 0 &&
        apiHistories[0]?.historyId !== currentYjsHistories[0]?.historyId);

    if (isDifferent || !currentYjsHistories) {
      console.log('📡 API → YJS 히스토리 동기화:', {
        apiCount: apiHistories.length,
        yjsCount: currentYjsHistories?.length || 0,
        isDifferent,
      });

      yMap.set('histories', JSON.parse(JSON.stringify(apiHistories)));
      yMap.set('lastUpdated', { value: Date.now() });
    }
  }, [yMap, apiResponse]);

  // 3. Yjs 연결 에러 핸들러
  useEffect(() => {
    if (!provider) return;

    const onStatus = (event: { status: string }) => {
      if (event.status !== 'connected') {
        setYjsError(new Error('Yjs SavePoint WebSocket 연결 실패'));
      } else {
        setYjsError(null);
      }
    };

    provider.on('status', onStatus);
    return () => provider.off('status', onStatus);
  }, [provider]);

  return {
    histories,
    isLoading: isApiLoading,
    error: apiError || yjsError,
    refetch,
  };
};
