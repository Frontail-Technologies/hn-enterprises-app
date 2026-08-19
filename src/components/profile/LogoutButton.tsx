import { LogOut } from 'lucide-react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

// `borderRadius` is passed in since Profile and More use different corner-radius tokens.
export function LogoutButton({ onPress, borderRadius }: { onPress: () => void; borderRadius: number }) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[styles.logoutRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius }]}
      onPress={onPress}
    >
      <LogOut size={17} color={colors.red} />
      <Text style={[styles.logoutText, { color: colors.red }]}>Logout</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  logoutRow: {
    height: 46,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  logoutText: {
    ...typography.label,
    fontSize: 12,
  },
});
