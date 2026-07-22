import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type ActionTileProps = {
  label: string;
  icon: ReactNode;
  helper?: string;
  onPress?: () => void;
};

export function ActionTile({ label, icon, helper, onPress }: ActionTileProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.82 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.softOrange }]}>{icon}</View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
          {label}
        </Text>
        {helper ? (
          <Text style={[styles.helper, { color: colors.muted }]} numberOfLines={1}>
            {helper}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 94,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  label: {
    ...typography.bodyMedium,
  },
  helper: {
    ...typography.label,
  },
  textWrap: {
    gap: spacing.xs,
  },
});
