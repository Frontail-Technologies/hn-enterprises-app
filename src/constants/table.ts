import type { AppColors } from './colors';
import { fontFamily } from './typography';

export const tableMetrics = {
  headerHeight: 42,
  rowHeight: 46,
  cellPaddingH: 9,
};

export const tableText = {
  header: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  primary: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 17,
  },
  medium: {
    fontFamily: fontFamily.medium,
    fontSize: 12.5,
    lineHeight: 16,
  },
  secondary: {
    fontFamily: fontFamily.regular,
    fontSize: 12.5,
    lineHeight: 16,
  },
};

export function tableDividers(colors: AppColors, isDark: boolean) {
  return {
    vertical: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,32,51,0.05)',
    row: colors.border,
    header: colors.border,
  };
}
