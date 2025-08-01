import { useQuery } from '@tanstack/react-query';
import { getRepositoryLogs } from '@/api/codeRunner';
import type { RepositoryLogsResponse } from '@/api/codeRunner';

export const useCodeRunnerLogs = (repositoryId?: number | string) => {
  return useQuery<RepositoryLogsResponse>({
    queryKey: ['repositoryLogs', repositoryId],
    queryFn: () => {
      if (!repositoryId) throw new Error('repositoryId is required');
      return getRepositoryLogs(repositoryId);
    },
    enabled: false, // 항상 refetch로만 요청
    refetchOnWindowFocus: false, // 포커스 때 자동재요청 방지
    retry: false, // 실패해도 자동재요청 방지
  });
};
