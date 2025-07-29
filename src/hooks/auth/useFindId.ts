import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { apiClient } from '@/api/client';
import type {
  FindIdURL,
  PhoneSendCodeURL,
  PhoneVerifyCodeURL,
} from '@/types/common/apiEndpoints.types';
import type {
  FindIdRequest,
  FindIdResponse,
  SendPhoneCodeRequest,
  SendPhoneCodeResponse,
  VerifyPhoneCodeRequest,
  VerifyPhoneCodeResponse,
} from '@/schemas/auth.schema';

// 아이디 찾기 훅
export const useFindId = (
  url: FindIdURL,
  options?: Omit<UseMutationOptions<FindIdResponse, AxiosError, FindIdRequest>, 'mutationFn'>
) => {
  const navigate = useNavigate();

  return useMutation<FindIdResponse, AxiosError, FindIdRequest>({
    mutationFn: async (data: FindIdRequest) => {
      const response = await apiClient.post<FindIdRequest, FindIdResponse>(url, data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      navigate({
        to: '/find-id/complete',
        search: { email: data.data.email },
      });
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('아이디 찾기 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 아이디 찾기용 인증번호 발송 훅
export const useSendPhoneCodeForFindId = (
  url: PhoneSendCodeURL,
  options?: Omit<
    UseMutationOptions<SendPhoneCodeResponse, AxiosError, Omit<SendPhoneCodeRequest, 'authType'>>,
    'mutationFn'
  >
) => {
  return useMutation<SendPhoneCodeResponse, AxiosError, Omit<SendPhoneCodeRequest, 'authType'>>({
    mutationFn: async data => {
      const requestData: SendPhoneCodeRequest = { ...data, authType: 'FIND_ID' };
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

// 아이디 찾기용 인증번호 확인 훅
export const useVerifyPhoneCodeForFindId = (
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
