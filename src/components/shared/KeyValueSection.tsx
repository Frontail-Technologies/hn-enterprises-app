import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

export type KeyValueItem = {
  label: string;
  value?: string | number | boolean | null;
};

type KeyValueSectionProps = {
  title: string;
  items: KeyValueItem[];
};

export function KeyValueSection({ title, items }: KeyValueSectionProps) {
  const { colors } = useTheme();

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.rows}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={[styles.label, { color: colors.muted }]}>{item.label}</Text>
            <Text style={[styles.separator, { color: colors.muted }]}>:</Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatValue(item.value)}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function formatValue(value: KeyValueItem['value']) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  divider: {
    height: 1,
  },
  rows: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    width: 124,
  },
  separator: {
    ...typography.label,
    width: 8,
    textAlign: 'center',
  },
  value: {
    ...typography.label,
    flex: 1,
  },
});
