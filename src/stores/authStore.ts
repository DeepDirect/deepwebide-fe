import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState } from '@/types/authState.types';

// TODO: 인증 API 연동 후 스토어 확장 여부 확인해야 함.
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      isLoggedIn: false,
      signin: () => set({ isLoggedIn: true }),
      signout: () => set({ isLoggedIn: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
