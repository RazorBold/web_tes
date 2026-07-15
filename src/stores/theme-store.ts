import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      }
      return { theme: nextTheme };
    }),
  setTheme: (theme) =>
    set(() => {
      if (typeof window !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      return { theme };
    }),
}));
