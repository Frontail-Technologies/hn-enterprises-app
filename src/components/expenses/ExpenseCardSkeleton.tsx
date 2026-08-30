import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { radius, spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeContext';

const PLACEHOLDER_COUNT = 6;

// Card-shaped placeholder matching ExpenseListItem's layout - the old
// TableSkeleton (column-width based) no longer visually matches now that
// the All Expenses list is a vertical card list, not a table.
export function ExpenseCardSkeleton() {
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
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Skeleton width={38} height={38} borderRadius={radius.sm} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Skeleton width="45%" height={14} />
          <Skeleton width={60} height={14} />
        </View>
        <Skeleton width="35%" height={12} />
        <View style={styles.bottomRow}>
          <Skeleton width="40%" height={11} />
          <Skeleton width={54} height={18} borderRadius={radius.sm} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
});
