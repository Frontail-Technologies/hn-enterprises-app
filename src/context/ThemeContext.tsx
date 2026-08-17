import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { AppColors, colors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark';

const darkColors: AppColors = {
  ...colors,
  background: '#11100D',
  surface: '#1C1A16',
  card: '#1C1A16',
  // Dark-mode elevation goes lighter as you move off the base background,
  // not darker - keeps the same "page < muted < surface" hierarchy as light.
  surfaceMuted: '#17150F',
  text: '#F9FAFB',
  muted: '#A8A29E',
  border: '#3B352B',
  borderStrong: '#52493A',
  softOrange: '#382A0E',
  softBlue: '#102A3D',
  accent: '#60A5FA',
  accentSoft: '#382A0E',
  blue: '#3B82F6',
};

type ThemeContextValue = {
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const isDark = mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : colors,
      isDark,
      mode,
      setMode,
      toggleTheme: () => setMode((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return value;
}
