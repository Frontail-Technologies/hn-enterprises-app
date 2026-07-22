import { colors } from './colors';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const statusToneColors: Record<StatusTone, { background: string; foreground: string }> = {
  success: { background: '#EAFBF1', foreground: colors.green },
  warning: { background: '#FFF7E6', foreground: colors.amber },
  danger: { background: '#FEF2F2', foreground: colors.red },
  info: { background: colors.softBlue, foreground: colors.blue },
  neutral: { background: '#F4F4F5', foreground: colors.muted },
};
