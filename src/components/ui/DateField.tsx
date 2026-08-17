import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInputProps,
} from "react-native";

import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { addMonths, toDateKey } from "@/utils/date";
import { formatDate } from "@/utils/format";
import { Sheet } from "./Sheet";

type DateFieldProps = Omit<
  TextInputProps,
  "placeholderTextColor" | "onChange"
> & {
  label: string;
  value?: string;
  required?: boolean;
  onChangeText?: (value: string) => void;
};

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

export function DateField({
  label,
  value,
  required,
  editable = true,
  onChangeText,
}: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getInitialMonth(value),
  );
  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {required ? <Text style={{ color: colors.red }}> *</Text> : null}
      </Text>
      <Pressable
        disabled={!editable}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.inputRow,
          {
            backgroundColor: editable ? colors.card : colors.background,
            borderColor: colors.border,
          },
          pressed && editable ? { opacity: 0.82 } : null,
        ]}
      >
        <Text
          style={[
            styles.inputText,
            {
              color: value
                ? editable
                  ? colors.text
                  : colors.muted
                : colors.muted,
            },
          ]}
        >
          {value ? formatDate(value) : "Select date"}
        </Text>
        <CalendarDays
          size={18}
          color={editable ? colors.primary : colors.muted}
        />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={styles.picker}>
          <View style={styles.monthHeader}>
            <Pressable
              onPress={() =>
                setVisibleMonth((current) => addMonths(current, -1))
              }
              style={styles.navButton}
            >
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {new Intl.DateTimeFormat("en-IN", {
                month: "long",
                year: "numeric",
              }).format(visibleMonth)}
            </Text>
            <Pressable
              onPress={() =>
                setVisibleMonth((current) => addMonths(current, 1))
              }
              style={styles.navButton}
            >
              <ChevronRight size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text
                key={`${day}-${index}`}
                style={[styles.weekDay, { color: colors.muted }]}
              >
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              const key = day ? toDateKey(day) : `empty-${index}`;
              const active = Boolean(day && value === toDateKey(day));

              return (
                <Pressable
                  key={key}
                  disabled={!day}
                  onPress={() => {
                    if (!day) return;
                    onChangeText?.(toDateKey(day));
                    setOpen(false);
                  }}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      { color: active ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {day ? day.getDate() : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Sheet>
    </View>
  );
}

function getInitialMonth(value?: string) {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return new Date();
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

function buildMonthDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: (Date | null)[] = Array.from(
    { length: firstDay.getDay() },
    () => null,
  );

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...typography.label,
    fontSize: 14,
    lineHeight: 18,
  },
  inputRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 14,
  },
  inputText: {
    ...typography.body,
    flex: 1,
  },
  picker: {
    gap: spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navButton: {
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
    gap: 0,
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
