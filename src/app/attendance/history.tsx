import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { FilterChip } from '@/components/shared/FilterChip';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { attendanceHistoryFilters } from '@/constants/attendance';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useAttendanceCalendar } from '@/hooks/useAttendanceCalendar';

export default function AttendanceHistoryScreen() {
  const { colors } = useTheme();
  const {
    goToPreviousMonth,
    goToNextMonth,
    monthTitle,
    filter,
    setFilter,
    calendarDays,
    presentCount,
    lateCount,
    absentCount,
  } = useAttendanceCalendar();

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="Attendance History" left={<BackButton />} />

      <View style={styles.monthRow}>
        <Pressable onPress={goToPreviousMonth} style={[styles.monthButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <ChevronLeft size={20} color={colors.accent} />
        </Pressable>
        <Text style={[styles.monthTitle, { color: colors.text }]}>{monthTitle}</Text>
        <Pressable onPress={goToNextMonth} style={[styles.monthButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <ChevronRight size={20} color={colors.accent} />
        </Pressable>
      </View>

      <Card style={styles.calendarCard}>
        <View style={styles.chips}>
          {attendanceHistoryFilters.map((item) => (
            <FilterChip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
          ))}
        </View>

        <View style={styles.weekRow}>
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
            <Text key={day} style={[styles.weekText, { color: colors.muted }]}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((item, index) =>
            item ? (
              <Pressable
                key={`${item.day}-${index}`}
                disabled={item.disabled}
                onPress={() =>
                  router.push({
                    pathname: '/attendance/[day]',
                    params: { day: String(item.day), date: item.dateKey, status: item.status },
                  })
                }
                style={({ pressed }) => [styles.dayCell, pressed && !item.disabled ? { opacity: 0.72 } : null]}
              >
                <View style={[styles.dayCircle, getDayStyle(item.status, colors)]}>
                  <Text style={[styles.dayText, { color: getDayTextColor(item.status, colors) }]}>
                    {item.day}
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View key={`empty-${index}`} style={styles.dayCell} />
            ),
          )}
        </View>

        <View style={styles.legend}>
          <LegendDot label="Present" color={colors.green} />
          <LegendDot label="Late" color={colors.primary} />
          <LegendDot label="Half Day" color={colors.amber} />
          <LegendDot label="Leave" color={colors.blue} />
          <LegendDot label="Absent" color={colors.red} />
          <LegendDot label="Not Marked" color={colors.muted} />
        </View>
      </Card>

      <View style={styles.statsRow}>
        <SmallStat label="Present" value={String(presentCount)} color={colors.green} />
        <SmallStat label="Late" value={String(lateCount)} color={colors.primary} />
        <SmallStat label="Absent" value={String(absentCount)} color={colors.red} />
      </View>
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

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function SmallStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={styles.smallStat}>
      <Text style={[styles.smallValue, { color }]}>{value}</Text>
      <Text style={styles.smallLabel}>{label}</Text>
    </Card>
  );
}

function getDayStyle(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'Present') return { backgroundColor: colors.green };
  if (status === 'Late') return { backgroundColor: colors.primary };
  if (status === 'Half Day') return { backgroundColor: colors.amber };
  if (status === 'Leave') return { backgroundColor: colors.blue };
  if (status === 'Absent') return { backgroundColor: colors.red };
  if (status === 'Future') return { backgroundColor: '#F1F5F9' };
  return { backgroundColor: 'transparent' };
}

function getDayTextColor(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (['Present', 'Late', 'Half Day', 'Leave', 'Absent'].includes(status)) return '#FFFFFF';
  if (status === 'Future') return colors.muted;
  return colors.text;
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
  monthRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  monthTitle: {
    ...typography.bodyMedium,
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 22,
  },
  calendarCard: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    lineHeight: 14,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
  },
  dayText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    lineHeight: 18,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.label,
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  smallStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  smallValue: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    lineHeight: 27,
  },
  smallLabel: {
    ...typography.label,
    color: '#64748B',
  },
});
