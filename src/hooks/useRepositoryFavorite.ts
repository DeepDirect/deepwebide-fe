import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { RepositoryFavoriteApiResponse } from '@/schemas/repo.schema';
import type { RepositoryFavoriteURL } from '@/types/apiEndpoints.types';

const useRepositoryFavorite = (
  options?: Omit<
    UseMutationOptions<RepositoryFavoriteApiResponse, AxiosError, number>,
    'mutationFn'
  >
) => {
  return useMutation<RepositoryFavoriteApiResponse, AxiosError, number>({
    mutationFn: async (id: number) => {
      const url = `/api/repositories/${id}/favorite` as RepositoryFavoriteURL;
      const response = await apiClient.post<void, RepositoryFavoriteApiResponse>(url);
      return response.data;
    },
    ...options,
  });
};

export default useRepositoryFavorite;
