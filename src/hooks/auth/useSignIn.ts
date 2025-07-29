import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { apiClient } from '@/api/client';
import type { SignInURL } from '@/types/common/apiEndpoints.types';
import type { SignInRequest, SignInResponse } from '@/schemas/auth.schema';

const useSignIn = (
  url: SignInURL,
  options?: Omit<UseMutationOptions<SignInResponse, AxiosError, SignInRequest>, 'mutationFn'>
) => {
  const navigate = useNavigate();

  return useMutation<SignInResponse, AxiosError, SignInRequest>({
    mutationFn: async (data: SignInRequest) => {
      const response = await apiClient.post<SignInRequest, SignInResponse>(url, data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      navigate({ to: '/main' });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('로그인 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useSignIn;
