import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { RepositoryExitURL } from '@/types/common/apiEndpoints.types';

const useRepositoryExit = (
  url: RepositoryExitURL,
  options?: Omit<UseMutationOptions<void, AxiosError, void>, 'mutationFn'>
) => {
  return useMutation<void, AxiosError, void>({
    mutationFn: async () => {
      await apiClient.post(url);
    },
    ...options,
  });
};

export default useRepositoryExit;
