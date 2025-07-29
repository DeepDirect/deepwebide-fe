import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '@/types/auth/authState.types';
import { authApi } from '@/api/auth.api';
import type { SignInRequest } from '@/api/auth.api';

// 앱 시작시 토큰 확인
const checkInitialAuth = () => {
  const token = localStorage.getItem('accessToken');
  return !!token;
};

// TODO: 인증 API 연동 후 스토어 확장 여부 확인해야 함.
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      // 로그인 상태 체크
      isLoggedIn: checkInitialAuth(),

      // 임시 로그인 API 호출 함수 추가, 추후 signin으로 변경 필요
      signin: async (data: SignInRequest) => {
        try {
          const response = await authApi.signIn(data);
          const { accessToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
          set({ isLoggedIn: true });

          return response.data;
        } catch (error) {
          // 에러 처리 로직 추가 필요
          alert('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
          console.error('로그인 실패:', error);
          throw error;
        }
      },

      // 로그아웃
      signout: async () => {
        try {
          await authApi.signOut();
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          set({ isLoggedIn: false });
        } catch (error) {
          console.error('로그아웃 실패:', error);
          // 로그아웃 API 실패해도 로컬 스토리지는 정리
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          set({ isLoggedIn: false });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
