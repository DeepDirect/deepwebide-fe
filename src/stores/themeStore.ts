import { create } from 'zustand';

type ThemeState = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>(set => ({
  isDarkMode: false,
  toggleTheme: () =>
    set(state => {
      const next = !state.isDarkMode;
      document.documentElement.classList.toggle('dark', next);
      return { isDarkMode: next };
    }),
}));
