import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { RepositoryURL } from '@/types/apiEndpoints.types';

export const useDeleteRepository = (
  url: RepositoryURL,
  options?: Omit<UseMutationOptions<void, AxiosError, number>, 'mutationFn'>
) => {
  return useMutation<void, AxiosError, number>({
    mutationFn: async () => {
      await apiClient.delete(`${url}`);
    },
    ...options,
  });
};
