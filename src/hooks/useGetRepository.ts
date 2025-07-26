import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { RepositoryResponse, RepositoryRequest } from '@/schemas/main.schema';
import type { RepositoryQueryURL } from '@/types/main.types';

const useGetRepository = (
  url: RepositoryQueryURL,
  params: RepositoryRequest,
  options?: Omit<UseQueryOptions<RepositoryResponse, AxiosError>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<RepositoryResponse, AxiosError>({
    queryKey: ['repository', url, params],
    queryFn: async () => {
      const response = await apiClient.get<RepositoryResponse, RepositoryRequest>(url, params);
      return response.data;
    },
    enabled: !!params,
    ...options,
  });
};

export default useGetRepository;
