import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
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
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { queryKeys, useRecentActivityQuery } from '@/queries';
import type { ActivityLogEntry } from '@/types/activity';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const authGuard = useAuthGuard();
  const [filterOpen, setFilterOpen] = useState(false);
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

  if (authGuard.blocked) return authGuard.element;

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen} onRefresh={onRefresh}>
      <AppHeader
        title="Recent Activity"
        left={<BackButton />}
        actions={
          filterOpen
            ? undefined
            : [
                {
                  key: 'filter',
                  icon: SlidersHorizontal,
                  accessibilityLabel: 'Filter activity',
                  active: hasFilter,
                  onPress: () => setFilterOpen(true),
                },
              ]
        }
        bottomContent={
          filterOpen ? (
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
              <Pressable onPress={() => setFilterOpen(false)} style={styles.headerAction}>
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : undefined
        }
      />

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
    alignItems: 'center',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  emptyFill: {
    flex: 1,
  },
});
