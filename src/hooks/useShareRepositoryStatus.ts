import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { RepositoryURL } from '@/types/apiEndpoints.types';
import type { UpdateRepositoryShareStatusResponse } from '@/schemas/repo.schema';

type Options = Omit<
  UseMutationOptions<UpdateRepositoryShareStatusResponse, AxiosError, void>,
  'mutationFn'
>;

export const useShareRepositoryStatus = (url: RepositoryURL, options?: Options) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateRepositoryShareStatusResponse, AxiosError, void>({
    mutationKey: ['repository', 'post'],
    mutationFn: async body => {
      const { data } = await apiClient.post<void, UpdateRepositoryShareStatusResponse>(url, body);

      return data;
    },
    onSuccess: (data, variables, context) => {
      // 관련 목록/상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['repository'] });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useShareRepositoryStatus;
