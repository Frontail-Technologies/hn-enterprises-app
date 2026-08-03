import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { radius, spacing } from '@/constants/spacing';

const PLACEHOLDER_COUNT = 6;

export function StatsGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <View key={index} style={styles.pressable}>
          <Card style={styles.card}>
            <Skeleton width="80%" height={13} />
            <View style={styles.bottom}>
              <Skeleton width={40} height={22} />
              <Skeleton width={30} height={30} borderRadius={radius.sm} />
            </View>
          </Card>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pressable: {
    width: '31.6%',
  },
  card: {
    width: '100%',
    minHeight: 106,
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
