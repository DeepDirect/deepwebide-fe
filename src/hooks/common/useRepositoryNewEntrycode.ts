import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { apiClient } from '@/api/client';
import type { RepositoryNewEntrycode } from '@/schemas/repo.schema';
import type { RepositoryNewEntryCodeURL } from '@/types/common/apiEndpoints.types';

export const useRepositoryNewEntrycode = (
  url: RepositoryNewEntryCodeURL,
  options?: Omit<UseMutationOptions<RepositoryNewEntrycode, AxiosError>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation<RepositoryNewEntrycode, AxiosError>({
    mutationKey: ['repository', 'post'],
    mutationFn: async () => {
      const { data } = await apiClient.post<void, RepositoryNewEntrycode>(url);
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

export default useRepositoryNewEntrycode;
