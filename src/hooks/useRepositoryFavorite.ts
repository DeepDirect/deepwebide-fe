import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { RepositoryFavoriteResponse } from '@/schemas/repo.schema';
import type { RepositoryFavoriteURL } from '@/types/apiEndpoints.types';

const useRepositoryFavorite = (
  options?: Omit<UseMutationOptions<RepositoryFavoriteResponse, AxiosError, number>, 'mutationFn'>
) => {
  return useMutation<RepositoryFavoriteResponse, AxiosError, number>({
    mutationFn: async (id: number) => {
      const url = `/api/repositories/${id}/favorite` as RepositoryFavoriteURL;
      const response = await apiClient.post<void, RepositoryFavoriteResponse>(url);
      return response.data;
    },
    ...options,
  });
};

export default useRepositoryFavorite;
