import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { apiClient } from '@/api/client';
import type {
  SignUpURL,
  EmailCheckURL,
  PhoneSendCodeURL,
  PhoneVerifyCodeURL,
} from '@/types/common/apiEndpoints.types';
import type {
  SignUpRequest,
  SignUpResponse,
  CheckEmailRequest,
  CheckEmailResponse,
  SendPhoneCodeRequest,
  SendPhoneCodeResponse,
  VerifyPhoneCodeRequest,
  VerifyPhoneCodeResponse,
} from '@/schemas/auth.schema';

// 회원가입 훅
export const useSignUp = (
  url: SignUpURL,
  options?: Omit<UseMutationOptions<SignUpResponse, AxiosError, SignUpRequest>, 'mutationFn'>
) => {
  const navigate = useNavigate();

  return useMutation<SignUpResponse, AxiosError, SignUpRequest>({
    mutationFn: async (data: SignUpRequest) => {
      const response = await apiClient.post<SignUpRequest, SignUpResponse>(url, data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
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
  url: EmailCheckURL,
  options?: Omit<
    UseMutationOptions<CheckEmailResponse, AxiosError, CheckEmailRequest>,
    'mutationFn'
  >
) => {
  return useMutation<CheckEmailResponse, AxiosError, CheckEmailRequest>({
    mutationFn: async (data: CheckEmailRequest) => {
      const response = await apiClient.post<CheckEmailRequest, CheckEmailResponse>(url, data);
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('이메일 중복 확인 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 회원가입용 인증번호 발송 훅
export const useSendPhoneCode = (
  url: PhoneSendCodeURL,
  options?: Omit<
    UseMutationOptions<SendPhoneCodeResponse, AxiosError, Omit<SendPhoneCodeRequest, 'authType'>>,
    'mutationFn'
  >
) => {
  return useMutation<SendPhoneCodeResponse, AxiosError, Omit<SendPhoneCodeRequest, 'authType'>>({
    mutationFn: async data => {
      const requestData: SendPhoneCodeRequest = { ...data, authType: 'SIGN_UP' };
      const response = await apiClient.post<SendPhoneCodeRequest, SendPhoneCodeResponse>(
        url,
        requestData
      );
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('인증번호 발송 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 회원가입용 인증번호 확인 훅
export const useVerifyPhoneCode = (
  url: PhoneVerifyCodeURL,
  options?: Omit<
    UseMutationOptions<VerifyPhoneCodeResponse, AxiosError, VerifyPhoneCodeRequest>,
    'mutationFn'
  >
) => {
  return useMutation<VerifyPhoneCodeResponse, AxiosError, VerifyPhoneCodeRequest>({
    mutationFn: async (data: VerifyPhoneCodeRequest) => {
      const response = await apiClient.post<VerifyPhoneCodeRequest, VerifyPhoneCodeResponse>(
        url,
        data
      );
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('인증번호 확인 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
