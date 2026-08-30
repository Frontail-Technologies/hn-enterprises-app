import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppColors, colors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | ThemeMode;

const THEME_PREFERENCE_KEY = 'hn_theme_preference';

const darkColors: AppColors = {
  ...colors,
  background: '#11100D',
  surface: '#1C1A16',
  card: '#1C1A16',
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
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => {
        if (mounted && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setThemePreferenceState(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference).catch(() => undefined);
  }, []);

  const mode: ThemeMode = themePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePreference;
  const isDark = mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: isDark ? darkColors : colors,
      isDark,
      mode,
      themePreference,
      setThemePreference,
      setMode: (nextMode: ThemeMode) => setThemePreference(nextMode),
      toggleTheme: () => setThemePreference(isDark ? 'light' : 'dark'),
    }),
    [isDark, mode, themePreference, setThemePreference],
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
