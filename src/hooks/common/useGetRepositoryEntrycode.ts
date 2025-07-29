import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';

import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';

import type { RepositoryEntrycodeApiResponse } from '@/schemas/repo.schema';
import type { RepositoryEntryCodeURL } from '@/types/common/apiEndpoints.types';

const useGetRepositoryEntrycode = (
  url: RepositoryEntryCodeURL,
  options?: Omit<
    UseQueryOptions<RepositoryEntrycodeApiResponse, AxiosError>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<RepositoryEntrycodeApiResponse, AxiosError>({
    queryKey: ['repository', url],
    queryFn: async () => {
      const response = await apiClient.get<RepositoryEntrycodeApiResponse>(url);
      return response.data;
    },
    ...options,
  });
};

export default useGetRepositoryEntrycode;
