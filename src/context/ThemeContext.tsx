import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppColors, colors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark';
// 'system' follows the OS appearance live; 'light'/'dark' is an explicit user override that
// wins regardless of what the OS is set to.
export type ThemePreference = 'system' | ThemeMode;

const THEME_PREFERENCE_KEY = 'hn_theme_preference';

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
  /** Resolved mode ('system' already collapsed to 'light'/'dark') - unchanged shape/name so
   * every existing consumer of `mode`/`isDark`/`colors` keeps working as-is. */
  mode: ThemeMode;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  /** Kept for the existing Profile/More screens' Switch - sets an explicit light/dark
   * preference (moving off "system" if that was active). */
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  // Live system appearance - useColorScheme() subscribes to OS changes and re-renders this
  // provider automatically, so "system" never reads a stale value captured only at startup.
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  // Loads the persisted preference once on mount. Deliberately not gating render on this -
  // "system" (the default before this resolves) is already correct for the common case; only a
  // user who previously pinned an explicit light/dark override could see a brief system-resolved
  // flash until this resolves, which the native/animated splash already covers for cold launch.
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
