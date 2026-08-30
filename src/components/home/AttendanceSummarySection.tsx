import { router } from 'expo-router';
import { LockKeyhole } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AttendanceReminderModal } from '@/components/shared/AttendanceReminderModal';
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
    if (
      attendance.loading ||
      attendance.isCheckedInToday ||
      hasShownAttendanceReminder()
    )
      return;

    // Claim the one-shot gate synchronously, the instant this effect
    // decides to schedule the reminder - not inside the timeout below. The
    // gate is a module-level flag shared across every mount of this
    // component, so if it were only set once the timeout fires, a second
    // concurrent effect invocation (a remount while this timer is still
    // pending, a dev double-invoke, or the effect re-running as attendance
    // state settles from loading -> loaded) would still see the gate open
    // during that 500ms window and schedule its own independent timer -
    // presenting a second, separately-stacked copy of this same sheet.
    // Claiming here closes that window entirely: whichever effect
    // invocation runs first wins, and every other one is turned away by the
    // guard at the top of this effect, regardless of what triggered it.
    markAttendanceReminderShown();

    const timer = setTimeout(() => {
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

      <AttendanceReminderModal visible={reminderVisible} onClose={() => setReminderVisible(false)} />
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
