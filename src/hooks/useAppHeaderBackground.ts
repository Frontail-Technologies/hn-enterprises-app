import { useTheme } from '@/context/ThemeContext';

// Single source of truth for AppHeader's resolved background color - used by
// AppHeader itself AND by Screen's sticky-header wrapper (see Screen.tsx),
// so the wrapper that briefly exists between a fresh screen mount and
// AppHeader's own paint is never a different, unresolved (or default-
// transparent, which on a brand-new native surface can render as an opaque
// white for a frame) color than AppHeader ends up painting a moment later.
// Keeping this in one hook - rather than duplicating the isDark ? ... : ...
// check in Screen.tsx - means the two can never drift out of sync if
// AppHeader's own background logic ever changes.
export function useAppHeaderBackground() {
  const { colors, isDark } = useTheme();
  return isDark ? colors.card : colors.accent;
}
