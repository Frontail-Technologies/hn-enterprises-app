import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type MetricPillProps = {
  label: string;
  value: string;
  icon?: ReactNode;
};

export function MetricPill({ label, value, icon }: MetricPillProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {icon ? <View style={[styles.icon, { backgroundColor: colors.softOrange }]}>{icon}</View> : null}
      <View style={styles.text}>
        <Text style={[typography.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[typography.h2, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  icon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
