import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { KickedMemberURL } from '@/types/common/apiEndpoints.types';

import type { ResponseDtoKickedMemberResponseType } from '@/schemas/repo.schema';

const useKickMemberRepository = (
  url: KickedMemberURL,
  options?: Omit<
    UseMutationOptions<ResponseDtoKickedMemberResponseType, AxiosError, number>,
    'mutationFn'
  >
) => {
  return useMutation<ResponseDtoKickedMemberResponseType, AxiosError, number>({
    mutationFn: async (memberId: number) => {
      const response = await apiClient.post<undefined, ResponseDtoKickedMemberResponseType>(
        `${url}/${memberId}`,
        undefined
      );
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useKickMemberRepository;
