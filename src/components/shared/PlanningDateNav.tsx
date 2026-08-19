import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Sheet } from "@/components/ui/Sheet";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { addMonths, toDateKey } from "@/utils/date";
import { formatDate } from "@/utils/format";

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

function parseDateKey(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function shiftDateKey(value: string, deltaDays: number) {
  const next = parseDateKey(value);
  next.setDate(next.getDate() + deltaDays);
  return toDateKey(next);
}

function buildMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: (Date | null)[] = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

// Compact date header for the Planning/DPR overview - a small ‹ date › nav
// row plus an optional Today action, not a full labeled DateField. Tapping
// the date opens the same month-grid picker DateField uses elsewhere.
export function PlanningDateNav({ date, onChange }: { date: string; onChange: (value: string) => void }) {
  const { colors } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateKey(date));
  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const isToday = date === toDateKey(new Date());

  const openPicker = () => {
    setVisibleMonth(parseDateKey(date));
    setPickerOpen(true);
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={() => onChange(shiftDateKey(date, -1))}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.navButton}
      >
        <ChevronLeft size={20} color={colors.text} />
      </Pressable>

      <Pressable onPress={openPicker} style={styles.dateButton}>
        <Text style={[styles.dateText, { color: colors.text }]} numberOfLines={1}>
          {formatDate(date)}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange(shiftDateKey(date, 1))}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.navButton}
      >
        <ChevronRight size={20} color={colors.text} />
      </Pressable>

      {!isToday ? (
        <Pressable onPress={() => onChange(toDateKey(new Date()))} style={[styles.todayButton, { borderColor: colors.border }]}>
          <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
        </Pressable>
      ) : null}

      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Select Date">
        <View style={styles.picker}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, -1))} style={styles.monthNavButton}>
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(visibleMonth)}
            </Text>
            <Pressable onPress={() => setVisibleMonth((current) => addMonths(current, 1))} style={styles.monthNavButton}>
              <ChevronRight size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text key={`${day}-${index}`} style={[styles.weekDay, { color: colors.muted }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              const key = day ? toDateKey(day) : `empty-${index}`;
              const active = Boolean(day && date === toDateKey(day));

              return (
                <Pressable
                  key={key}
                  disabled={!day}
                  onPress={() => {
                    if (!day) return;
                    onChange(toDateKey(day));
                    setPickerOpen(false);
                  }}
                  style={[
                    styles.dayCell,
                    { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.dayText, { color: active ? "#FFFFFF" : colors.text }]}>{day ? day.getDate() : ""}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dateButton: {
    flex: 1,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  todayButton: {
    minHeight: 32,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  todayText: {
    ...typography.caption,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  picker: {
    gap: spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthNavButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  weekRow: {
    flexDirection: "row",
  },
  weekDay: {
    ...typography.caption,
    width: `${100 / 7}%`,
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayText: {
    ...typography.label,
  },
});
