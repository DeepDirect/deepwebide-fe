import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';
import { useToast } from '@/hooks/common/useToast';

import api from '@/api/api';
import type { ChangePasswordURL } from '@/types/common/apiEndpoints.types';
import type { ResetPasswordRequest, ResetPasswordResponse } from '@/schemas/auth.schema';

// 비밀번호 재설정 훅
const useChangePassword = (
  url: ChangePasswordURL,
  options?: Omit<
    UseMutationOptions<ResetPasswordResponse, AxiosError, ResetPasswordRequest>,
    'mutationFn'
  >
) => {
  const navigate = useNavigate();
  const toast = useToast();

  return useMutation<ResetPasswordResponse, AxiosError, ResetPasswordRequest>({
    mutationFn: async (data: ResetPasswordRequest) => {
      // body에서 reauthToken 제거하고 헤더로만 전송
      const requestBody = {
        newPassword: data.newPassword,
        passwordCheck: data.passwordCheck,
      };

      // api 직접 사용
      const response = await api.post<ResetPasswordResponse>(url, requestBody, {
        headers: {
          Authorization: `Bearer ${data.reauthToken}`,
        },
      });
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      navigate({ to: '/sign-in' });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('비밀번호 재설정 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useChangePassword;
