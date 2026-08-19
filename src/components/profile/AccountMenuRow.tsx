import { ChevronRight } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type AccountMenuRowProps = {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress?: () => void;
};

export function AccountMenuRow({ icon: Icon, label, onPress }: AccountMenuRowProps) {
  const { colors } = useTheme();

  return (
    <PressableScale style={styles.menuRow} onPress={onPress}>
      <Icon size={17} color={colors.muted} />
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={17} color={colors.muted} />
    </PressableScale>
  );
}

export function AccountMenuDivider() {
  const { colors } = useTheme();
  return <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  menuRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuDivider: {
    height: 1,
    marginLeft: 42,
  },
  menuLabel: {
    ...typography.label,
    flex: 1,
    fontSize: 12,
  },
});
