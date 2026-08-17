import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

export function FilterButton({ activeCount, onPress }: { activeCount: number; onPress: () => void }) {
  const { colors } = useTheme();
  const active = activeCount > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={active ? `Filter, ${activeCount} active` : 'Filter'}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.card, borderColor: active ? colors.primary : colors.border },
        pressed && { opacity: 0.8 },
      ]}
    >
      <SlidersHorizontal size={18} color={active ? colors.primary : colors.muted} />
      {active ? (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.input,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.label,
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
  },
});
