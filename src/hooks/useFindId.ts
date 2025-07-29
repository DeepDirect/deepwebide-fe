import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { authApi } from '@/api/auth.api';
import type {
  FindIdRequest,
  FindIdResponse,
  SendPhoneCodeRequest,
  SendPhoneCodeResponse,
  VerifyPhoneCodeRequest,
  VerifyPhoneCodeResponse,
} from '@/api/auth.api';

// 아이디 찾기 훅
export const useFindId = (
  options?: Omit<UseMutationOptions<FindIdResponse, AxiosError, FindIdRequest>, 'mutationFn'>
) => {
  const navigate = useNavigate();

  return useMutation<FindIdResponse, AxiosError, FindIdRequest>({
    mutationFn: async (data: FindIdRequest) => {
      const response = await authApi.findId(data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // 아이디 찾기 성공 시 완료 페이지로 이동
      navigate({ to: '/find-id/complete', search: { email: data.data.email } });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('아이디 찾기 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 휴대폰 인증번호 발송 훅 (FIND_ID용)
export const useSendPhoneCodeForFindId = (
  options?: Omit<
    UseMutationOptions<SendPhoneCodeResponse, AxiosError, SendPhoneCodeRequest>,
    'mutationFn'
  >
) => {
  return useMutation<SendPhoneCodeResponse, AxiosError, SendPhoneCodeRequest>({
    mutationFn: async (data: SendPhoneCodeRequest) => {
      const response = await authApi.sendPhoneCode(data);
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('인증번호 발송 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 휴대폰 인증번호 확인 훅
export const useVerifyPhoneCodeForFindId = (
  options?: Omit<
    UseMutationOptions<VerifyPhoneCodeResponse, AxiosError, VerifyPhoneCodeRequest>,
    'mutationFn'
  >
) => {
  return useMutation<VerifyPhoneCodeResponse, AxiosError, VerifyPhoneCodeRequest>({
    mutationFn: async (data: VerifyPhoneCodeRequest) => {
      const response = await authApi.verifyPhoneCode(data);
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('인증번호 확인 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
