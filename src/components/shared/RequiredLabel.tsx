import { StyleSheet, Text, View } from 'react-native';

import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type RequiredLabelProps = {
  label: string;
  required?: boolean;
};

export function RequiredLabel({ label, required }: RequiredLabelProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {required ? <Text style={[styles.required, { color: colors.red }]}>*</Text> : null}
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  required: {
    ...typography.label,
    fontSize: 14,
    lineHeight: 16,
  },
  label: {
    ...typography.label,
  },
});
