import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';

import type { CreateRepoRequest, CreateRepoResponse } from '@/schemas/repo.schema';
import type { CreateRepoURL } from '@/types/apiEndpoints.types';

const useCreateRepository = (
  url: CreateRepoURL,
  options?: Omit<
    UseMutationOptions<CreateRepoResponse, AxiosError, CreateRepoRequest>,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<CreateRepoResponse, AxiosError, CreateRepoRequest>({
    mutationFn: async (data: CreateRepoRequest) => {
      const response = await apiClient.post<CreateRepoRequest, CreateRepoResponse>(url, data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['repository'] });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export default useCreateRepository;
