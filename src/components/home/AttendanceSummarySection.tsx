import { router } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AttendanceReminderSheet } from '@/components/shared/AttendanceReminderSheet';
import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import { toDateKey } from '@/utils/date';
import { formatTime } from '@/utils/format';
import {
  hasShownAttendanceReminder,
  markAttendanceReminderShown,
} from '@/utils/attendanceReminder';

export function AttendanceSummarySection() {
  const { colors } = useTheme();
  const attendance = useAttendanceStatus();
  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    // Guards against showing this more than once per session - e.g. if this
    // re-mounts (tab re-focus) while the timer is pending, or the effect
    // re-runs as attendance state settles from loading -> loaded.
    if (
      attendance.loading ||
      attendance.isCheckedInToday ||
      hasShownAttendanceReminder()
    )
      return;

    const timer = setTimeout(() => {
      markAttendanceReminderShown();
      setReminderVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [attendance.isCheckedInToday, attendance.loading]);

  const statusLabel = attendance.isCheckedOutToday
    ? 'Checked Out'
    : attendance.isCheckedInToday
      ? 'Checked In'
      : 'Not Checked In';
  const statusHelper = attendance.isCheckedOutToday
    ? `Out ${formatTime(attendance.checkOutAt)} Today`
    : attendance.isCheckedInToday
      ? `In ${formatTime(attendance.checkInAt)} Today`
      : 'Location required';
  const statusColor = attendance.isCheckedInToday ? colors.green : colors.primary;

  return (
    <>
      <Card style={styles.attendanceCard}>
        <View style={[styles.lockCircle, { borderColor: statusColor }]}>
          <LockKeyhole size={23} color={statusColor} />
        </View>
        <View style={styles.attendanceText}>
          <Text style={[typography.label, { color: colors.muted }]}>Attendance</Text>
          <Text style={[styles.checkedIn, { color: statusColor }]}>{statusLabel}</Text>
          <Text style={[typography.caption, { color: colors.muted }]}>{statusHelper}</Text>
        </View>
        <Pressable
          onPress={() =>
            guardNavigation(() => {
              if (attendance.isCheckedInToday) {
                const today = new Date();
                router.push({
                  pathname: '/attendance/[day]',
                  params: {
                    day: String(today.getDate()),
                    date: toDateKey(today),
                    status: 'Present',
                  },
                });
                return;
              }

              router.push('/attendance');
            })
          }
          style={[styles.detailsButton, { borderColor: colors.border }]}
        >
          <Text style={[typography.label, { color: colors.text }]}>View Details</Text>
        </Pressable>
      </Card>

      <AttendanceReminderSheet visible={reminderVisible} onClose={() => setReminderVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  attendanceCard: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  lockCircle: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 27,
  },
  attendanceText: {
    flex: 1,
    gap: 1,
  },
  checkedIn: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  detailsButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
});
