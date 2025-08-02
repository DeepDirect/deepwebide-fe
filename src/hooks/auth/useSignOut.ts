import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/common/useToast';
import type { SignOutURL } from '@/types/common/apiEndpoints.types';
import type { SignOutResponse } from '@/schemas/auth.schema';
import { useAuthStore } from '@/stores/authStore';

const useSignOut = (
  url: SignOutURL,
  options?: Omit<UseMutationOptions<SignOutResponse, AxiosError, void>, 'mutationFn'>
) => {
  const { setLoggedOut } = useAuthStore(); // authStore 상태 업데이트 함수
  const toast = useToast();

  return useMutation<SignOutResponse, AxiosError, void>({
    mutationFn: async () => {
      const response = await apiClient.post<void, SignOutResponse>(url);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // authStore 상태 업데이트
      setLoggedOut();
      toast.success('성공적으로 로그아웃되었습니다.', 2000);
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // API 실패해도 로컬 상태는 정리
      setLoggedOut();
      toast.warning('로그아웃 처리 중 문제가 발생했지만 정상적으로 로그아웃되었습니다.', 3000);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useSignOut;
