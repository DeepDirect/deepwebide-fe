import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import type { SignOutURL } from '@/types/common/apiEndpoints.types';
import type { SignOutResponse } from '@/schemas/auth.schema';
import { useAuthStore } from '@/stores/authStore';

const useSignOut = (
  url: SignOutURL,
  options?: Omit<UseMutationOptions<SignOutResponse, AxiosError, void>, 'mutationFn'>
) => {
  const { setLoggedOut } = useAuthStore(); // authStore 상태 업데이트 함수

  return useMutation<SignOutResponse, AxiosError, void>({
    mutationFn: async () => {
      const response = await apiClient.post<void, SignOutResponse>(url);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // authStore 상태 업데이트
      setLoggedOut();
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('로그아웃 실패:', error);
      // API 실패해도 로컬 상태는 정리
      setLoggedOut();
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useSignOut;
