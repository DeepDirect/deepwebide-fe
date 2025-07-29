import { create } from 'zustand';

type ThemeState = {
  isDarkMode: boolean;
  isInitialized: boolean;
  toggleTheme: () => void;
  initializeTheme: () => void;
  enableRepoTheme: () => void;
  disableRepoTheme: () => void;
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

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  isInitialized: false,

  toggleTheme: () => {
    const newTheme = !get().isDarkMode;
    set({ isDarkMode: newTheme });
    applyThemeToDOM(newTheme);
    localStorage.setItem('repo-theme', JSON.stringify(newTheme));
  },

  initializeTheme: () => {
    const { isDarkMode } = get();
    applyThemeToDOM(isDarkMode);
    set({ isInitialized: true });
  },

  // repo 페이지 진입 시
  enableRepoTheme: () => {
    const stored = localStorage.getItem('repo-theme');
    const isDarkMode = stored !== null ? JSON.parse(stored) : getSystemDarkMode();

    // 로컬 스토리지에 저장 (처음 진입 시에도 저장)
    localStorage.setItem('repo-theme', JSON.stringify(isDarkMode));

    set({ isDarkMode });
    applyThemeToDOM(isDarkMode);
  },

  // repo 페이지 이탈 시
  disableRepoTheme: () => {
    localStorage.removeItem('repo-theme');
    applyThemeToDOM(false);
    set({ isDarkMode: false });
  },
}));
