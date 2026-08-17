import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { spacing } from '@/constants/spacing';
import { tableDividers } from '@/constants/table';
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
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.rows}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <View
              key={item.label}
              style={[styles.row, !isLast && styles.rowDivider, !isLast && { borderBottomColor: dividers.vertical }]}
            >
              <Text style={[styles.label, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.separator, { color: colors.muted }]}>:</Text>
              <Text style={[styles.value, { color: colors.text }]}>{formatValue(item.value)}</Text>
            </View>
          );
        })}
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
    gap: spacing.xs,
    padding: spacing.md,
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
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
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
