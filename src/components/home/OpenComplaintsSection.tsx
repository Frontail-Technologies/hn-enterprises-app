import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { complaintStatusLabels } from '@/constants/complaints';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import { useComplaintStatusCountsQuery } from '@/queries';
import type { ComplaintStatus } from '@/services/complaints.service';

const STATUS_ORDER: ComplaintStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export function OpenComplaintsSection() {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch } = useComplaintStatusCountsQuery();

  return (
    <View style={styles.quickSection}>
      <SectionHeader title="Complaints" onPress={() => guardNavigation(() => router.push('/complaints'))} />
      {isLoading ? (
        <View style={styles.grid}>
          {STATUS_ORDER.map((status) => (
            <Skeleton key={status} style={styles.chip} />
          ))}
        </View>
      ) : isError ? (
        <Pressable onPress={() => refetch()} style={[styles.errorCard, { borderColor: colors.border }]}>
          <Text style={[typography.caption, { color: colors.muted }]}>
            Couldn&apos;t load complaint counts — tap to retry.
          </Text>
        </Pressable>
      ) : (
        <View style={styles.grid}>
          {STATUS_ORDER.map((status) => (
            <AnimatedPressable
              key={status}
              scaleTo={0.99}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                guardNavigation(() => router.push({ pathname: '/complaints', params: { status } }))
              }
            >
              <Text style={[styles.count, { color: colors.text }]}>{data?.[status] ?? 0}</Text>
              <Text style={[typography.caption, { color: colors.muted }]} numberOfLines={1}>
                {complaintStatusLabels[status]}
              </Text>
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
  chip: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
  },
  count: {
    ...typography.h2,
    fontSize: 20,
    lineHeight: 24,
  },
  errorCard: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
});
