import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { UseQueryOptions } from '@tanstack/react-query';

import type { RepositorySettingsResponse } from '@/schemas/repo.schema';
import type { AxiosError } from 'axios';

const useGetRepositorySettings = (
  repositoryId: number | string,
  options?: Omit<UseQueryOptions<RepositorySettingsResponse, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RepositorySettingsResponse, AxiosError>({
    queryKey: ['repository', 'settings', repositoryId],
    queryFn: async () => {
      const response = await apiClient.get<RepositorySettingsResponse>(
        `/api/repositories/${repositoryId}/settings`
      );
      return response.data;
    },
    enabled: !!repositoryId,
    ...options,
  });
};

export default useGetRepositorySettings;
