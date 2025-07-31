import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { RepositoryURL } from '@/types/common/apiEndpoints.types';

const useDeleteRepository = (
  url: RepositoryURL,
  options?: Omit<UseMutationOptions<void, AxiosError, void>, 'mutationFn'> & {
    enabled?: boolean;
  }
) => {
  return useMutation<void, AxiosError, void>({
    mutationFn: async () => {
      await apiClient.delete(`${url}`);
    },
    ...options,
  });
};

export default useDeleteRepository;
