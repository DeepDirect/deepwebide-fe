import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/api/client';
import type { RepositoryRenameRequest, RepositoryRenameApiResponse } from '@/schemas/repo.schema';
import type { RepositoryURL } from '@/types/common/apiEndpoints.types';

export const useRepositoryRename = (
  url: RepositoryURL,
  options?: Omit<
    UseMutationOptions<RepositoryRenameApiResponse, AxiosError, RepositoryRenameRequest>,
    'mutationFn'
  > & {
    enabled?: boolean;
  }
) => {
  const queryClient = useQueryClient();

  return useMutation<RepositoryRenameApiResponse, AxiosError, RepositoryRenameRequest>({
    mutationFn: async rename => {
      const { data } = await apiClient.patch<RepositoryRenameRequest, RepositoryRenameApiResponse>(
        url,
        rename
      );
      return data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['repository'] });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useRepositoryRename;
