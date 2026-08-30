import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { complaintStatusLabels } from '@/constants/complaints';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import { useComplaintStatusCountsQuery } from '@/queries';
import type { ComplaintStatus } from '@/services/complaints.service';

const STATUS_ORDER: ComplaintStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

function statusColor(status: ComplaintStatus, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'open') return colors.red;
  if (status === 'in_progress') return colors.amber;
  if (status === 'resolved') return colors.green;
  return colors.muted;
}

export function OpenComplaintsSection() {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch } = useComplaintStatusCountsQuery();

  return (
    <View style={styles.quickSection}>
      <SectionHeader title="Complaints" onPress={() => guardNavigation(() => router.push('/complaints'))} />
      {isLoading ? (
        <View style={styles.grid}>
          {STATUS_ORDER.map((status) => (
            <Card key={status} style={styles.card}>
              <Skeleton width={18} height={18} borderRadius={9} />
              <Skeleton width={28} height={22} />
              <Skeleton width="80%" height={12} />
            </Card>
          ))}
        </View>
      ) : isError ? (
        <ErrorState compact title="Couldn't load complaint counts" onRetry={refetch} />
      ) : (
        <View style={styles.grid}>
          {STATUS_ORDER.map((status) => (
            <AnimatedPressable
              key={status}
              scaleTo={0.99}
              style={styles.pressable}
              onPress={() =>
                guardNavigation(() => router.push({ pathname: '/complaints', params: { status } }))
              }
            >
              <Card style={styles.card}>
                <View style={[styles.dot, { backgroundColor: statusColor(status, colors) }]} />
                <Text style={[styles.count, { color: colors.text }]}>{data?.[status] ?? 0}</Text>
                <Text style={[typography.label, styles.label, { color: colors.muted }]} numberOfLines={1}>
                  {complaintStatusLabels[status]}
                </Text>
              </Card>
            </AnimatedPressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quickSection: {
    gap: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    minHeight: 78,
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  count: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 24,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
