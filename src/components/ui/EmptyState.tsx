import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { StateIllustration } from './StateIllustration';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  fill?: boolean;
};

export function EmptyState({ title, description, action, icon, compact, fill }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, fill && styles.wrapFill]}>
      <View style={[styles.message, compact && styles.messageCompact]}>
        {icon ? (
          <View style={[styles.iconWrap, compact && styles.iconWrapCompact, { backgroundColor: colors.softOrange }]}>
            {icon}
          </View>
        ) : (
          <StateIllustration kind="empty" size={compact ? 48 : 64} />
        )}
        <Text style={[typography.bodyMedium, styles.centered, { color: colors.text }]}>{title}</Text>
        {description ? (
          <Text style={[typography.caption, styles.centered, { color: colors.muted }]}>{description}</Text>
        ) : null}
      </View>
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
  wrapFill: {
    flex: 1,
  },
  message: {
    alignItems: 'center',
    gap: spacing.md,
    opacity: 0.6,
  },
  messageCompact: {
    gap: spacing.sm,
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
