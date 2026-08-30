import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActivityListItem } from '@/components/shared/ActivityListItem';
import { RecentActivitySkeleton } from '@/components/shared/RecentActivitySkeleton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import { useRecentActivityQuery } from '@/queries';
import type { ActivityLogEntry } from '@/types/activity';

const RECENT_ACTIVITY_LIMIT = 4;

// Reads attendance directly from context (rather than via a prop from Home)
// so today's check-in/out synthetic activity stays next to the one section
// that needs it.
export function RecentActivitySection() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const attendance = useAttendanceStatus();

  const attendanceActivity = useMemo<ActivityLogEntry[]>(() => {
    const activity: ActivityLogEntry[] = [];

    if (attendance.checkInAt) {
      activity.push({
        id: 'activity-attendance-check-in',
        title: 'Checked In',
        description: attendance.checkInLocation?.address ?? 'Today check-in captured with location.',
        category: 'Attendance',
        timestamp: attendance.checkInAt,
        route: { pathname: '/attendance' },
      });
    }

    if (attendance.checkOutAt) {
      activity.push({
        id: 'activity-attendance-check-out',
        title: 'Checked Out',
        description: attendance.checkOutLocation?.address ?? 'Today checkout captured with location.',
        category: 'Attendance',
        timestamp: attendance.checkOutAt,
        route: { pathname: '/attendance' },
      });
    }

    return activity;
  }, [
    attendance.checkInAt,
    attendance.checkInLocation?.address,
    attendance.checkOutAt,
    attendance.checkOutLocation?.address,
  ]);

  const { data, isLoading } = useRecentActivityQuery({
    extra: attendanceActivity,
    limit: RECENT_ACTIVITY_LIMIT,
    supervisorId: user?.id,
  });
  const recentActivity = data?.items ?? [];

  return (
    <View style={styles.quickSection}>
      <SectionHeader title="Recent Activity" onPress={() => guardNavigation(() => router.push('/activity'))} />
      {isLoading ? (
        <RecentActivitySkeleton />
      ) : recentActivity.length ? (
        <View style={styles.list}>
          {recentActivity.map((item) => (
            <ActivityListItem key={item.id} item={item} />
          ))}
          {data?.partial ? (
            <Text style={[typography.caption, { color: colors.muted }]}>Some activity may be missing right now.</Text>
          ) : null}
        </View>
      ) : (
        <EmptyState compact title="No activity yet" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quickSection: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
});
