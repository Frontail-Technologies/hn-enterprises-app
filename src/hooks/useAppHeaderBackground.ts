import { useTheme } from '@/context/ThemeContext';

export function useAppHeaderBackground() {
  const { colors, isDark } = useTheme();
  return isDark ? colors.card : colors.accent;
}
