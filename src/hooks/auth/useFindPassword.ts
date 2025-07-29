import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useNavigate } from '@tanstack/react-router';

import { apiClient } from '@/api/client';
import type {
  FindPasswordURL,
  PhoneSendCodeURL,
  PhoneVerifyCodeURL,
} from '@/types/common/apiEndpoints.types';
import type {
  VerifyUserRequest,
  VerifyUserResponse,
  SendPhoneCodeRequest,
  SendPhoneCodeResponse,
  VerifyPhoneCodeRequest,
  VerifyPhoneCodeResponse,
} from '@/schemas/auth.schema';

// 비밀번호 찾기
export const useFindPassword = (
  url: FindPasswordURL,
  options?: Omit<
    UseMutationOptions<VerifyUserResponse, AxiosError, VerifyUserRequest>,
    'mutationFn'
  >
) => {
  const navigate = useNavigate();

  return useMutation<VerifyUserResponse, AxiosError, VerifyUserRequest>({
    mutationFn: async (data: VerifyUserRequest) => {
      console.log('비밀번호 찾기 API 요청:', data);
      const response = await apiClient.post<VerifyUserRequest, VerifyUserResponse>(url, data);
      console.log('비밀번호 찾기 API 응답:', response.data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      console.log('비밀번호 찾기 성공:', data);

      // reauthToken 확인
      const token = data.data?.reauthToken;
      console.log('받은 reauthToken:', token ? '***' + token.slice(-4) : 'undefined');

      if (!token) {
        console.error('reauthToken이 응답에 없습니다!');
        alert('서버 응답에 인증 토큰이 없습니다. 다시 시도해주세요.');
        return;
      }

      // localStorage에 reauthToken 저장
      localStorage.setItem('reauthToken', token);
      console.log('localStorage에 reauthToken 저장 완료');

      // 저장 확인
      const savedToken = localStorage.getItem('reauthToken');
      console.log('저장된 토큰 확인:', savedToken ? '***' + savedToken.slice(-4) : 'null');

      // 비밀번호 재설정 페이지로 이동
      navigate({ to: '/find-password/change' });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('사용자 검증 실패:', error);
      console.error('에러 응답:', error.response?.data);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 비밀번호 찾기용 인증번호 발송 훅
export const useSendPhoneCodeForFindPassword = (
  url: PhoneSendCodeURL,
  options?: Omit<
    UseMutationOptions<SendPhoneCodeResponse, AxiosError, Omit<SendPhoneCodeRequest, 'authType'>>,
    'mutationFn'
  >
) => {
  return useMutation<SendPhoneCodeResponse, AxiosError, Omit<SendPhoneCodeRequest, 'authType'>>({
    mutationFn: async data => {
      const requestData: SendPhoneCodeRequest = { ...data, authType: 'FIND_PASSWORD' };
      console.log('인증번호 발송 요청:', requestData);
      const response = await apiClient.post<SendPhoneCodeRequest, SendPhoneCodeResponse>(
        url,
        requestData
      );
      console.log('인증번호 발송 응답:', response.data);
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('인증번호 발송 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};

// 비밀번호 찾기용 인증번호 확인 훅
export const useVerifyPhoneCodeForFindPassword = (
  url: PhoneVerifyCodeURL,
  options?: Omit<
    UseMutationOptions<VerifyPhoneCodeResponse, AxiosError, VerifyPhoneCodeRequest>,
    'mutationFn'
  >
) => {
  return useMutation<VerifyPhoneCodeResponse, AxiosError, VerifyPhoneCodeRequest>({
    mutationFn: async (data: VerifyPhoneCodeRequest) => {
      console.log('인증번호 확인 요청:', data);
      const response = await apiClient.post<VerifyPhoneCodeRequest, VerifyPhoneCodeResponse>(
        url,
        data
      );
      console.log('인증번호 확인 응답:', response.data);
      return response.data;
    },
    onError: (error, variables, context) => {
      console.error('인증번호 확인 실패:', error);
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
};
