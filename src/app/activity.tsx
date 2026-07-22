import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityListItem } from '@/components/shared/ActivityListItem';
import { AppHeader } from '@/components/shared/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { getRecentActivity, type ActivityLogEntry } from '@/services/mockData';

export default function ActivityScreen() {
  const { checkInAt, checkOutAt, checkInLocation, checkOutLocation } = useAttendanceStatus();
  const extra: ActivityLogEntry[] = [];

  if (checkInAt) {
    extra.push({
      id: 'activity-attendance-check-in',
      title: 'Checked In',
      description: checkInLocation?.address ?? 'Today check-in captured with location.',
      category: 'Attendance',
      timestamp: checkInAt,
      route: { pathname: '/attendance' },
    });
  }

  if (checkOutAt) {
    extra.push({
      id: 'activity-attendance-check-out',
      title: 'Checked Out',
      description: checkOutLocation?.address ?? 'Today checkout captured with location.',
      category: 'Attendance',
      timestamp: checkOutAt,
      route: { pathname: '/attendance' },
    });
  }
  const activity = getRecentActivity({ extra, limit: 50 });

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen}>
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
