import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
};

// 시스템 다크모드 감지
const getSystemDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false, // 기본값 (persist에서 초기화됨)

      toggleTheme: () =>
        set(state => {
          const next = !state.isDarkMode;
          document.documentElement.classList.toggle('dark', next);
          return { isDarkMode: next };
        }),

      initializeTheme: () => {
        const { isDarkMode } = get();
        document.documentElement.classList.toggle('dark', isDarkMode);
      },
    }),
    {
      name: 'theme-storage',
      version: 1,

      // 스토리지에서 값을 가져온 후 DOM에 적용
      onRehydrateStorage: () => state => {
        if (state) {
          document.documentElement.classList.toggle('dark', state.isDarkMode);
        }
      },

      // 초기화 시 로컬스토리지에 값이 없으면 시스템 테마로 설정
      merge: (persistedState, currentState): ThemeState => {
        // 로컬스토리지에 저장된 값이 있고 올바른 형태인지 확인
        if (
          persistedState &&
          typeof persistedState === 'object' &&
          'isDarkMode' in persistedState &&
          typeof persistedState.isDarkMode === 'boolean'
        ) {
          return { ...currentState, isDarkMode: persistedState.isDarkMode };
        }

        // 로컬스토리지에 값이 없거나 유효하지 않으면 시스템 테마를 초기값으로 사용
        const systemDarkMode = getSystemDarkMode();
        return { ...currentState, isDarkMode: systemDarkMode };
      },
    }
  )
);
