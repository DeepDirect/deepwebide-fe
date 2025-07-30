import { useQuery } from '@tanstack/react-query';
import { entrycodeApi } from '@/api/entrycode.api';

interface UseRepositoryInfoParams {
  repositoryId: string;
  enabled?: boolean;
}

export const useRepositoryInfo = ({ repositoryId, enabled = true }: UseRepositoryInfoParams) => {
  return useQuery({
    queryKey: ['repositoryInfo', repositoryId],
    queryFn: async () => {
      const response = await entrycodeApi.getRepositoryAccessibility(repositoryId);
      return response.data.data.repository;
    },
    enabled: enabled && !!repositoryId,
    staleTime: 1000 * 60 * 5, // 5분
    retry: (failureCount, error) => {
      // 접근 권한 오류는 재시도하지 않음
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status: number } };
        if (axiosError.response?.status === 403 || axiosError.response?.status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
};
