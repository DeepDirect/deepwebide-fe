import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';

import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';

import type { RepositoryEntrycodeResponse } from '@/schemas/repo.schema';
import type { RepositoryEntryCodeURL } from '@/types/apiEndpoints.types';

const useGetRepositoryEntrycode = (
  url: RepositoryEntryCodeURL,
  options?: Omit<UseQueryOptions<RepositoryEntrycodeResponse, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RepositoryEntrycodeResponse, AxiosError>({
    queryKey: ['repository', url],
    queryFn: async () => {
      const response = await apiClient.get<RepositoryEntrycodeResponse>(url);
      return response.data;
    },
    ...options,
  });
};

export default useGetRepositoryEntrycode;
