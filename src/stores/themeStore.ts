import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  isDarkMode: boolean;
  isInitialized: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
};

// 시스템 다크모드 감지
const getSystemDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// DOM에 테마 클래스 적용
const applyThemeToDOM = (isDarkMode: boolean) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false, // 기본값 (persist에서 초기화됨)
      isInitialized: false,

      toggleTheme: () =>
        set(state => {
          const next = !state.isDarkMode;
          applyThemeToDOM(next);
          return { isDarkMode: next };
        }),

      initializeTheme: () => {
        const { isDarkMode } = get();
        applyThemeToDOM(isDarkMode);
        set({ isInitialized: true });
      },
    }),
    {
      name: 'theme-storage',
      version: 1,

      // 스토리지에서 값을 가져온 후 즉시 DOM에 적용
      onRehydrateStorage: () => state => {
        if (state) {
          // 복원된 즉시 DOM에 적용
          applyThemeToDOM(state.isDarkMode);
          // 초기화 완료 마킹
          setTimeout(() => {
            state.initializeTheme();
          }, 0);
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
          const isDarkMode = persistedState.isDarkMode;
          // 즉시 DOM에 적용
          applyThemeToDOM(isDarkMode);
          return { ...currentState, isDarkMode, isInitialized: false };
        }

        // 로컬스토리지에 값이 없거나 유효하지 않으면 시스템 테마를 초기값으로 사용
        const systemDarkMode = getSystemDarkMode();
        applyThemeToDOM(systemDarkMode);
        return { ...currentState, isDarkMode: systemDarkMode, isInitialized: false };
      },
    }
  )
);
