import { apiClient } from './client';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    user: {
      id: number;
      username: string;
      email: string;
      nickname: string;
      profileImageUrl: string;
    };
  };
}

export interface SignOutResponse {
  status: number;
  message: string;
  data: object;
}

// 회원가입
export interface SignUpRequest {
  email: string;
  username: string;
  password: string;
  passwordCheck: string;
  phoneNumber: string;
}

export interface SignUpResponse {
  status: number;
  message: string;
  data: {
    id: number;
    username: string;
    nickname: string;
    profileImageUrl: string;
  };
}

// 이메일 중복 확인
export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  status: number;
  message: string;
  data: {
    isAvailable: boolean;
  };
}

// 휴대폰 인증번호 발송
export interface SendPhoneCodeRequest {
  phoneNumber: string;
  username: string;
  authType: 'SIGN_UP' | 'FIND_ID' | 'FIND_PASSWORD';
}

export interface SendPhoneCodeResponse {
  status: number;
  message: string;
  data: {
    expiresIn: number;
  };
}

// 휴대폰 인증번호 확인
export interface VerifyPhoneCodeRequest {
  phoneNumber: string;
  phoneCode: string;
}

export interface VerifyPhoneCodeResponse {
  status: number;
  message: string;
  data: {
    verified: boolean;
  };
}

// 아이디 찾기 관련 인터페이스
export interface FindIdRequest {
  username: string;
  phoneNumber: string;
  phoneCode: string;
}

export interface FindIdResponse {
  status: number;
  message: string;
  data: {
    email: string;
  };
}

export const authApi = {
  /**
   * 로그인 API
   */
  signIn: (data: SignInRequest) => {
    return apiClient.post<SignInRequest, SignInResponse>('/api/auth/signin', data);
  },

  /**
   * 로그아웃 API
   */
  signOut: () => {
    return apiClient.post<void, SignOutResponse>('/api/auth/signout');
  },

  signUp: (data: SignUpRequest) => {
    return apiClient.post<SignUpRequest, SignUpResponse>('/api/auth/signup', data);
  },

  /**
   * 이메일 중복 확인 API - 주석 유행도 따라가~
   */
  checkEmail: (data: CheckEmailRequest) => {
    return apiClient.post<CheckEmailRequest, CheckEmailResponse>('/api/auth/email/check', data);
  },

  /**
   * 휴대폰 인증번호 발송 API
   */
  sendPhoneCode: (data: SendPhoneCodeRequest) => {
    return apiClient.post<SendPhoneCodeRequest, SendPhoneCodeResponse>(
      '/api/auth/phone/send-code',
      data
    );
  },

  /**
   * 휴대폰 인증번호 확인 API
   */
  verifyPhoneCode: (data: VerifyPhoneCodeRequest) => {
    return apiClient.post<VerifyPhoneCodeRequest, VerifyPhoneCodeResponse>(
      '/api/auth/phone/verify-code',
      data
    );
  },

  /**
   * 아이디 찾기 API
   */
  findId: (data: FindIdRequest) => {
    return apiClient.post<FindIdRequest, FindIdResponse>('/api/auth/email/find', data);
  },
};
