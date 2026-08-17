import { StyleSheet, Text } from 'react-native';

import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

export function InlineFieldError({ message }: { message?: string }) {
  const { colors } = useTheme();
  if (!message) return null;

  return <Text style={[styles.text, { color: colors.red }]}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
});
