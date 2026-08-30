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
  // For use inside sheets/tables/list areas - trims padding and icon size
  // instead of the full-page presentation.
  compact?: boolean;
  // For use as a FlashList/FlatList `ListEmptyComponent` - without flex: 1,
  // `justifyContent: 'center'` on `wrap` centers within a View that's
  // already exactly as tall as its own content, i.e. it does nothing
  // visually, and the empty state renders pinned to the top of the list's
  // viewport instead of centered in it. Opt-in (not the default) because
  // EmptyState is also used inline in bounded, non-full-page contexts
  // (cards, sheets, dropdowns) where stretching to fill would be wrong.
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
  // Dims the icon/title/description block only, not `action` (e.g. a Retry
  // button) - a fallback message should read as quiet/secondary, but an
  // interactive control inside it still needs full visibility.
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
