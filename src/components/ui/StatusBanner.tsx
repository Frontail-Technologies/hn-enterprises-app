import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

export type BannerTone = 'success' | 'warning' | 'error' | 'info';

type StatusBannerProps = {
  tone?: BannerTone;
  title?: string;
  message: string;
  action?: ReactNode;
};

export function StatusBanner({ tone = 'info', title, message, action }: StatusBannerProps) {
  const { colors } = useTheme();
  const toneColor =
    tone === 'success' ? colors.green : tone === 'warning' ? colors.amber : tone === 'error' ? colors.red : colors.blue;
  const Icon =
    tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertTriangle : tone === 'error' ? XCircle : Info;

  return (
    <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: toneColor }]}>
      <Icon size={18} color={toneColor} />
      <View style={styles.copy}>
        {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  message: {
    ...typography.caption,
  },
});
