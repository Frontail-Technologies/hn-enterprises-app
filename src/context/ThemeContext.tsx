import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';

import { AppColors, colors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark';

const darkColors: AppColors = {
  ...colors,
  background: '#11100D',
  card: '#1C1A16',
  text: '#F9FAFB',
  muted: '#A8A29E',
  border: '#3B352B',
  softOrange: '#382A0E',
  softBlue: '#102A3D',
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
