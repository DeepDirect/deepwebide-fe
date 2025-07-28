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
};
