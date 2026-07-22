import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text style={[typography.caption, { color: colors.muted, textAlign: 'center' }]}>{description}</Text>
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
});
