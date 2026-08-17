import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityListItem } from '@/components/shared/ActivityListItem';
import { AppHeader } from '@/components/shared/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import type { ActivityLogEntry } from '@/services/mockData';

export default function ActivityScreen() {
  const { user } = useAuth();
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

  const { items: activity } = useRecentActivity({ extra, limit: 50, supervisorId: user?.id });
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] }),
      refetchAttendance(),
    ]);
  }, [queryClient, refetchAttendance]);

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen} onRefresh={onRefresh}>
      <AppHeader title="Recent Activity" left={<BackButton />} />

      {activity.length ? (
        <View style={styles.list}>
          {activity.map((item) => (
            <ActivityListItem key={item.id} item={item} />
          ))}
        </View>
      ) : (
        <EmptyState title="No recent activity" description="Your work updates and submissions will appear here." />
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
  list: {
    gap: spacing.sm,
  },
});
