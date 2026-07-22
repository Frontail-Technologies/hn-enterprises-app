import { StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

type QuantityFieldRowProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  unit?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
};

export function QuantityFieldRow({ label, value, onChangeText, unit = 'Qty', keyboardType = 'decimal-pad' }: QuantityFieldRowProps) {
  const { colors } = useTheme();
  const { ref, onFocus } = useScrollIntoViewOnFocus();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[typography.label, { color: colors.muted }]}>{unit}</Text>
      </View>
      <TextInput
        ref={ref}
        onFocus={onFocus}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder="-"
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  input: {
    width: 92,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    ...typography.bodyMedium,
  },
});
