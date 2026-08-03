import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { radius, spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeContext';

const PLACEHOLDER_COUNT = 3;

export function RecentActivitySkeleton() {
  return (
    <View style={styles.list}>
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <Row key={index} />
      ))}
    </View>
  );
}

function Row() {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width={38} height={38} borderRadius={radius.sm} />
      <View style={styles.copy}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="85%" height={12} />
      </View>
      <Skeleton width={36} height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
});
