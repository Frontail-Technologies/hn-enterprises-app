import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CalendarDays, Clock3, ClipboardList, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAttendanceStatus } from '@/context/AttendanceContext';
import { useTheme } from '@/context/ThemeContext';
import { toDateKey } from '@/utils/date';
import { formatDate } from '@/utils/format';

export default function AttendanceDayDetailScreen() {
  const { colors } = useTheme();
  const attendance = useAttendanceStatus();
  const params = useLocalSearchParams<{ day?: string; date?: string; status?: string }>();
  const day = Number(params.day ?? 28);
  const status = params.status === 'Absent' || params.status === 'Late' || params.status === 'Not Marked' ? params.status : 'Present';
  const isAbsent = status === 'Absent' || status === 'Not Marked';
  const isLate = status === 'Late';
  const isToday = params.date === toDateKey(new Date());
  const checkInTime = isToday && attendance.checkInAt ? new Date(attendance.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const checkOutTime = isToday && attendance.checkOutAt ? new Date(attendance.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const location = isToday
    ? attendance.checkOutLocation ?? attendance.checkInLocation
    : undefined;

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader
        title="Today Detail"
        left={
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <View style={styles.content}>
        <Card elevated style={styles.detailCard}>
          <Text style={[styles.dateTitle, { color: colors.text }]}>{formatDate(params.date) || `Day ${day}`}</Text>

          <View style={[styles.statusPill, { backgroundColor: getStatusSoftColor(status, colors) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status, colors) }]}>{status}</Text>
          </View>

          <DetailRow
            icon={<Clock3 size={18} color={colors.accent} />}
            label="Check-in Time"
            value={isAbsent ? '-' : checkInTime ?? (isLate ? '10:12 AM' : '08:47 AM')}
          />
          <DetailRow
            icon={<Clock3 size={18} color={colors.accent} />}
            label="Check-out Time"
            value={isAbsent ? '-' : checkOutTime ?? 'Pending'}
          />
          <DetailRow
            icon={<MapPin size={18} color={colors.accent} />}
            label="Current Location"
            value={
              isAbsent
                ? '-'
                : location?.address ?? 'Green Valley, Sector 12, Gurugram, Haryana'
            }
          />
        </Card>

        <Card style={[styles.planCard, { backgroundColor: colors.softBlue }]}>
          <View style={styles.planHeader}>
            <CalendarDays size={19} color={colors.accent} />
            <Text style={[styles.planTitle, { color: colors.accent }]}>{"Today's Plan"}</Text>
          </View>
          <Text style={[typography.body, { color: colors.text }]}>
            Footing inspection at Green Valley and column shuttering check at City Center.
          </Text>
        </Card>

        <Card style={styles.detailCard}>
          <View style={styles.planHeader}>
            <ClipboardList size={19} color={colors.primary} />
            <Text style={[styles.planTitle, { color: colors.text }]}>Attendance Remarks</Text>
          </View>
          <Text style={[typography.body, { color: colors.text }]}>
            {isAbsent ? 'Attendance was not marked for this date.' : 'Site inspection and field work completed.'}
          </Text>
        </Card>
      </View>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
      {icon}
      <Text style={[styles.detailLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function getStatusColor(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'Absent') return colors.red;
  if (status === 'Late') return colors.primary;
  return colors.green;
}

function getStatusSoftColor(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'Absent') return '#FEE2E2';
  if (status === 'Late') return colors.softOrange;
  return '#DCFCE7';
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 104,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  detailCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  dateTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statusText: {
    ...typography.bodyMedium,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  detailLabel: {
    flex: 1,
    ...typography.caption,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    ...typography.bodyMedium,
  },
  planCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTitle: {
    ...typography.bodyMedium,
  },
});
