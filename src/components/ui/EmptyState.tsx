import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  // For use inside sheets/tables/list areas - trims padding and icon size
  // instead of the full-page presentation.
  compact?: boolean;
};

export function EmptyState({ title, description, action, icon, compact }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {icon ? (
        <View style={[styles.iconWrap, compact && styles.iconWrapCompact, { backgroundColor: colors.softOrange }]}>
          {icon}
        </View>
      ) : null}
      <Text style={[typography.h2, styles.centered, { color: colors.text }]}>{title}</Text>
      {description ? (
        <Text style={[typography.caption, styles.centered, { color: colors.muted }]}>{description}</Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  wrapCompact: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
  },
  centered: {
    textAlign: 'center',
  },
});
