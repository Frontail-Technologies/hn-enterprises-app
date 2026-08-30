import { StyleSheet, Text } from 'react-native';

import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type RequiredLabelProps = {
  label: string;
  required?: boolean;
};

export function RequiredLabel({ label, required }: RequiredLabelProps) {
  const { colors } = useTheme();

  return (
    <Text style={[styles.label, { color: colors.muted }]}>
      {label}
      {required ? <Text style={{ color: colors.red }}> *</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
  },
});
