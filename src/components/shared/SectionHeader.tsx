import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onPress: () => void;
};

export function SectionHeader({ title, actionLabel = 'View all', onPress }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <AnimatedPressable scaleTo={1} style={styles.action} onPress={onPress}>
        <Text style={[typography.label, { color: colors.primary }]}>{actionLabel}</Text>
        <ChevronRight size={16} color={colors.primary} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
