import type { UserInfo } from '@/stores/authStore';

export interface AuthState {
  // 상태
  isLoggedIn: boolean;
  user: UserInfo | null;

  // 상태 조회 메서드
  getUserInfo: () => UserInfo | null;

  // 상태 업데이트 메서드
  setLoggedIn: (user: UserInfo, accessToken: string) => void;
  setLoggedOut: () => void;
}
