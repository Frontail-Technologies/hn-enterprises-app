import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

function formatValue(value: InfoRowProps['value']) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

export function InfoRow({ label, value }: InfoRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={2}>
        {formatValue(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  label: {
    flex: 0.9,
    ...typography.label,
  },
  value: {
    flex: 1.2,
    textAlign: 'right',
    ...typography.bodyMedium,
  },
});
