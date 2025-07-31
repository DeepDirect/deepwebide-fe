import { apiClient } from '@/api/client';
import type {
  SaveHistoryRequest,
  SaveHistoryResponse,
  RestoreHistoryResponse,
  HistoriesResponse,
} from './types';

export const historyService = {
  // 전체 파일/폴더 저장(히스토리 생성)
  saveHistory: (repositoryId: string, data: SaveHistoryRequest) =>
    apiClient.post<SaveHistoryRequest, SaveHistoryResponse>(
      `/api/repositories/${repositoryId}/save`,
      data
    ),

  // 히스토리 목록 조회
  getHistories: (repositoryId: string) =>
    apiClient.get<HistoriesResponse>(`/api/repositories/${repositoryId}/histories`),

  // 히스토리 복원
  restoreHistory: (repositoryId: string, historyId: number) =>
    apiClient.post<void, RestoreHistoryResponse>(
      `/api/repositories/${repositoryId}/histories/${historyId}/restore`
    ),
};
