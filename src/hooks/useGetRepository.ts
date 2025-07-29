import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';

import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';

import type { RepositoryRequest, RepositoryApiResponse } from '@/schemas/repo.schema';
import type { RepositoryQueryURL } from '@/types/apiEndpoints.types';

const useGetRepository = (
  url: RepositoryQueryURL,
  params: RepositoryRequest,
  options?: Omit<UseQueryOptions<RepositoryApiResponse, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RepositoryApiResponse, AxiosError>({
    queryKey: ['repository', url, params],
    queryFn: async () => {
      const response = await apiClient.get<RepositoryApiResponse, RepositoryRequest>(url, params);
      return response.data as RepositoryApiResponse;
    },
    enabled: !!params,
    ...options,
  });
};

export default useGetRepository;
