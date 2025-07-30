import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 사용자 정보 타입
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  nickname: string;
  profileImageUrl: string;
}

export interface SignInUser {
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    nickname: string;
    profileImageUrl: string;
  };
}

// 로컬스토리지에서 사용자 정보 가져오기
const getUserFromStorage = (): UserInfo | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('사용자 정보 파싱 실패:', error);
    return null;
  }
};

// 앱 시작시 토큰 확인
const checkInitialAuth = (): boolean => {
  const token = localStorage.getItem('accessToken');
  return !!token;
};

interface AuthState {
  // 상태
  isLoggedIn: boolean;
  user: UserInfo | null;

  // 상태 조회 메서드
  getUserInfo: () => UserInfo | null;

  // 상태 업데이트 메서드 (개별 훅에서 호출)
  setLoggedIn: (user: UserInfo, accessToken: string) => void;
  setLoggedOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      isLoggedIn: checkInitialAuth(),
      user: getUserFromStorage(),

      // 사용자 정보 가져오기
      getUserInfo: () => {
        const state = get();
        return state.user || getUserFromStorage();
      },

      // 소셜 로그인
      setAuthSocialLogin: (data: SignInUser) => {
        const { accessToken, user } = data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        set({ isLoggedIn: true, user: user });
      },

      // 로그인 상태로 설정 (개별 훅에서 호출)
      setLoggedIn: (user: UserInfo, accessToken: string) => {
        // 로컬스토리지 저장
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        // 상태 업데이트
        set({
          isLoggedIn: true,
          user: user,
        });
      },

      // 로그아웃 상태로 설정 (개별 훅에서 호출)
      setLoggedOut: () => {
        // 로컬스토리지 정리
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        // 상태 업데이트
        set({
          isLoggedIn: false,
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      // persist에서 상태만 저장
      partialize: state => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user,
      }),
    }
  )
);
