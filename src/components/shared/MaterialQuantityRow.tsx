import { StyleSheet, Text, TextInput, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

type MaterialQuantityRowProps = {
  label: string;
  category?: 'Material' | 'Pipe' | 'Valve' | 'Fitting';
  unit: string;
  value: string;
  onChangeText: (value: string) => void;
};

export function MaterialQuantityRow({
  label,
  category = 'Material',
  unit,
  value,
  onChangeText,
}: MaterialQuantityRowProps) {
  const { colors } = useTheme();
  const { ref, onFocus } = useScrollIntoViewOnFocus();

  return (
    <View style={styles.row}>
      <View style={[styles.nameBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.category, { color: colors.muted }]}>{category}</Text>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <View style={[styles.quantityBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          ref={ref}
          onFocus={onFocus}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder={unit}
          placeholderTextColor={colors.muted}
          style={[styles.quantityInput, { color: colors.text }]}
        />
        <Text style={[styles.unit, { color: colors.muted }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameBox: {
    flex: 1,
    minHeight: 62,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  category: {
    ...typography.label,
    marginBottom: 2,
  },
  label: {
    ...typography.body,
    lineHeight: 20,
  },
  quantityBox: {
    width: 98,
    minHeight: 62,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  quantityInput: {
    minHeight: 28,
    padding: 0,
    textAlign: 'center',
    ...typography.bodyMedium,
  },
  unit: {
    ...typography.label,
    textAlign: 'center',
  },
});
