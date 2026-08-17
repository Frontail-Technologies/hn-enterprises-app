import { router } from 'expo-router';
import type { ClipboardCheck } from 'lucide-react-native';
import { type DimensionValue, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import type { SupervisorStatTone } from '@/services/mobileStats';

// Stat values arrive as "done/total" (e.g. "0/699") for progress-style stats,
// or a plain count for others - the card only ever shows the single number
// that matters at a glance (the "done" side), not the denominator.
export function formatStatValue(value: string) {
  const [primary] = value.split('/');
  return primary?.trim() || value;
}

type StatSummaryCardProps = {
  id: string;
  label: string;
  value: string;
  icon: typeof ClipboardCheck;
  tone: SupervisorStatTone;
  widthPercent?: DimensionValue;
};

export function StatSummaryCard({ id, label, value, icon: Icon, tone, widthPercent }: StatSummaryCardProps) {
  const { colors } = useTheme();
  const accentColor = getAccentColor(tone, colors);
  const softColor = getSoftColor(tone, colors);

  return (
    <Pressable
      onPress={() => guardNavigation(() => router.push({ pathname: '/stats/[type]', params: { type: id } }))}
      style={({ pressed }) => [styles.pressable, widthPercent ? { width: widthPercent } : null, pressed && { opacity: 0.72 }]}
    >
      <Card style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: softColor }]}>
          <Icon size={16} color={accentColor} />
        </View>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
          {label}
        </Text>
        <Text
          style={[styles.value, { color: accentColor }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {formatStatValue(value)}
        </Text>
      </Card>
    </Pressable>
  );
}

function getAccentColor(tone: SupervisorStatTone, colors: ReturnType<typeof useTheme>['colors']) {
  if (tone === 'red') return colors.red;
  if (tone === 'green') return colors.green;
  if (tone === 'orange') return colors.primary;
  return colors.blue;
}

function getSoftColor(tone: SupervisorStatTone, colors: ReturnType<typeof useTheme>['colors']) {
  if (tone === 'red') return '#FEE2E2';
  if (tone === 'green') return '#DCFCE7';
  if (tone === 'orange') return colors.softOrange;
  return colors.softBlue;
}

const styles = StyleSheet.create({
  pressable: {
    width: '31.6%',
  },
  card: {
    minHeight: 106,
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  iconBox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  label: {
    ...typography.label,
    fontSize: 11,
    lineHeight: 14,
  },
  value: {
    width: '100%',
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    lineHeight: 28,
  },
});
