import { StyleSheet, Text, View } from 'react-native';

import { statusToneColors, StatusTone } from '@/constants/status';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type BadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const toneColors = statusToneColors[tone];

  return (
    <View style={[styles.badge, { backgroundColor: toneColors.background }]}>
      <Text style={[styles.label, { color: toneColors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: {
    ...typography.label,
  },
});
