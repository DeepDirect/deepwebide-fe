import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { historyService } from '../historyService';
import { useYjsSavePoint } from '@/hooks/repo/useYjsSavePoint';
import type { HistoryItem, SaveHistoryRequest } from '../types';

// 히스토리 목록 조회 훅
export const useHistoriesQuery = (repositoryId: string) => {
  return useQuery({
    queryKey: ['histories', repositoryId],
    queryFn: () => historyService.getHistories(repositoryId),
    enabled: !!repositoryId,
  });
};

// 히스토리 저장 뮤테이션 (Yjs 동기화 포함)
export const useSaveHistoryMutation = (repositoryId: string) => {
  const queryClient = useQueryClient();
  const repositoryIdNumber = parseInt(repositoryId, 10);
  const { syncHistoriesFromServer, broadcastHistoryUpdate } = useYjsSavePoint(repositoryIdNumber);

  return useMutation({
    mutationFn: (data: SaveHistoryRequest) => historyService.saveHistory(repositoryId, data),
    onSuccess: async (response, variables) => {
      try {
        // 1. React Query 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ['histories', repositoryId] });

        // 2. 다른 클라이언트에게 작업 알림 (생성된 히스토리 정보 포함)
        const newHistoryItem: Partial<HistoryItem> = {
          historyId: response.data?.data?.historyId,
          message: variables.message,
          createdAt: new Date().toISOString(),
          // createdBy는 실제 API 응답에서 받아와야 하지만, 임시로 처리
        };

        broadcastHistoryUpdate('create', newHistoryItem);

        // 3. 서버에서 최신 히스토리를 가져와서 YJS에 동기화
        await syncHistoriesFromServer();

        console.log('✅ 히스토리 저장 완료 - YJS 동기화됨');
      } catch (error) {
        console.error('히스토리 저장 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('히스토리 저장 실패:', error);
    },
  });
};

// 히스토리 복원 뮤테이션 (Yjs 동기화 포함)
export const useRestoreHistoryMutation = (repositoryId: string) => {
  const queryClient = useQueryClient();
  const repositoryIdNumber = parseInt(repositoryId, 10);
  const { syncHistoriesFromServer, broadcastHistoryUpdate } = useYjsSavePoint(repositoryIdNumber);

  return useMutation({
    mutationFn: (historyId: number) => historyService.restoreHistory(repositoryId, historyId),
    onSuccess: async (_response, historyId) => {
      try {
        // 1. React Query 캐시 무효화 (히스토리 목록과 파일트리 모두)
        queryClient.invalidateQueries({ queryKey: ['histories', repositoryId] });
        // 파일트리도 복원으로 인해 변경될 수 있으므로 무효화
        queryClient.invalidateQueries({ queryKey: ['fileTree', repositoryIdNumber] });

        // 2. 다른 클라이언트에게 복원 작업 알림
        broadcastHistoryUpdate('restore', { historyId, restoredAt: new Date().toISOString() });

        // 3. 서버에서 최신 히스토리를 가져와서 YJS에 동기화
        await syncHistoriesFromServer();

        console.log('✅ 히스토리 복원 완료 - YJS 동기화됨');
      } catch (error) {
        console.error('히스토리 복원 후 동기화 실패:', error);
      }
    },
    onError: error => {
      console.error('히스토리 복원 실패:', error);
    },
  });
};
