import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { authApi } from '@/api/auth.api';
import type {
  SignUpRequest,
  SignUpResponse,
  CheckEmailRequest,
  CheckEmailResponse,
  SendPhoneCodeRequest,
  SendPhoneCodeResponse,
  VerifyPhoneCodeRequest,
  VerifyPhoneCodeResponse,
} from '@/api/auth.api';

// 회원가입 훅
export const useSignUp = (
  options?: Omit<UseMutationOptions<SignUpResponse, AxiosError, SignUpRequest>, 'mutationFn'>
) => {
  const navigate = useNavigate();

  return useMutation<SignUpResponse, AxiosError, SignUpRequest>({
    mutationFn: async (data: SignUpRequest) => {
      const response = await authApi.signUp(data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      // 회원가입 성공 시 완료 페이지로 이동
      navigate({ to: '/sign-up/complete' });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('회원가입 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 이메일 중복 확인 훅
export const useCheckEmail = (
  options?: Omit<
    UseMutationOptions<CheckEmailResponse, AxiosError, CheckEmailRequest>,
    'mutationFn'
  >
) => {
  return useMutation<CheckEmailResponse, AxiosError, CheckEmailRequest>({
    mutationFn: async (data: CheckEmailRequest) => {
      const response = await authApi.checkEmail(data);
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('이메일 중복 확인 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 휴대폰 인증번호 발송 훅
export const useSendPhoneCode = (
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
export const useVerifyPhoneCode = (
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
