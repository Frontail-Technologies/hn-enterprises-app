import { useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityListItem } from '@/components/shared/ActivityListItem';
import { AppHeader } from '@/components/shared/AppHeader';
import { RecentActivitySkeleton } from '@/components/shared/RecentActivitySkeleton';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { activityDateFilters, activityTypeFilters } from '@/constants/activity';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useActivityListFilters } from '@/hooks/useActivityListFilters';
import { queryKeys, useRecentActivityQuery } from '@/queries';
import type { ActivityLogEntry } from '@/types/activity';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { checkInAt, checkOutAt, checkInLocation, checkOutLocation, refetch: refetchAttendance } = useAttendanceStatus();

  const extra = useMemo<ActivityLogEntry[]>(() => {
    const activity: ActivityLogEntry[] = [];

    if (checkInAt) {
      activity.push({
        id: 'activity-attendance-check-in',
        title: 'Checked In',
        description: checkInLocation?.address ?? 'Today check-in captured with location.',
        category: 'Attendance',
        timestamp: checkInAt,
        route: { pathname: '/attendance' },
      });
    }

    if (checkOutAt) {
      activity.push({
        id: 'activity-attendance-check-out',
        title: 'Checked Out',
        description: checkOutLocation?.address ?? 'Today checkout captured with location.',
        category: 'Attendance',
        timestamp: checkOutAt,
        route: { pathname: '/attendance' },
      });
    }

    return activity;
  }, [checkInAt, checkInLocation?.address, checkOutAt, checkOutLocation?.address]);

  const { data, isLoading } = useRecentActivityQuery({ extra, limit: 50, supervisorId: user?.id });
  const activity = data?.items ?? [];
  const {
    filteredActivity,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    dateSelectOpen,
    setDateSelectOpen,
    typeSelectOpen,
    setTypeSelectOpen,
  } = useActivityListFilters(activity);
  const hasFilter = dateFilter !== 'All' || typeFilter !== 'All';

  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.all }),
      refetchAttendance(),
    ]);
  }, [queryClient, refetchAttendance]);

  // No _layout.tsx covers this route - it guards itself like ProtectedStack
  // does elsewhere. Placed after all hook calls above, not before, so hook
  // call order stays stable every render.
  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect href="/auth/login" />;

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen} onRefresh={onRefresh}>
      <AppHeader title="Recent Activity" left={<BackButton />} />

      <View style={styles.filtersRow}>
        <SimpleSelect
          label="Date"
          value={dateFilter}
          options={activityDateFilters}
          open={dateSelectOpen}
          onOpenChange={setDateSelectOpen}
          onChange={setDateFilter}
        />
        <SimpleSelect
          label="Type"
          value={typeFilter}
          options={activityTypeFilters}
          open={typeSelectOpen}
          onOpenChange={setTypeSelectOpen}
          onChange={setTypeFilter}
        />
      </View>

      {isLoading ? (
        <RecentActivitySkeleton />
      ) : filteredActivity.length ? (
        <View style={styles.list}>
          {filteredActivity.map((item) => (
            <ActivityListItem key={item.id} item={item} />
          ))}
          {data?.partial ? (
            <Text style={[typography.caption, { color: colors.muted }]}>Some activity may be missing right now.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyFill}>
          <EmptyState
            fill
            title={hasFilter ? 'No matching activity' : 'No recent activity'}
            description={hasFilter ? 'Try changing or clearing your filters.' : 'Your work updates and submissions will appear here.'}
          />
        </View>
      )}
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerAction}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  // Gives Screen's Reveal-wrapping mechanism (getChildFlexStyle) a real
  // `style` prop with flex: 1 to detect and pass through - EmptyState's own
  // `fill` prop only handles centering *within* itself, not claiming space
  // from its parent, which this wrapper does.
  emptyFill: {
    flex: 1,
  },
});
