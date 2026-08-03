import { Clock3 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextInputProps } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { Sheet } from './Sheet';

type TimeFieldProps = Omit<TextInputProps, 'placeholderTextColor' | 'onChange'> & {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  minuteStep?: number;
};

export function TimeField({ label, value, editable = true, onChangeText, minuteStep = 5 }: TimeFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const options = useMemo(() => buildTimeOptions(minuteStep), [minuteStep]);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
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
        <Text style={[styles.inputText, { color: value ? (editable ? colors.text : colors.muted) : colors.muted }]}>
          {value ? formatDisplayTime(value) : 'Select time'}
        </Text>
        <Clock3 size={18} color={editable ? colors.primary : colors.muted} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <ScrollView contentContainerStyle={styles.optionGrid} showsVerticalScrollIndicator={false}>
          {options.map((option) => {
            const active = value === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChangeText?.(option.value);
                  setOpen(false);
                }}
                style={[
                  styles.option,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.optionText, { color: active ? '#FFFFFF' : colors.text }]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </View>
  );
}

function buildTimeOptions(step: number) {
  const normalizedStep = Math.max(1, Math.min(60, step));
  const options: { label: string; value: string }[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += normalizedStep) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push({ value, label: formatDisplayTime(value) });
    }
  }

  return options;
}

function formatDisplayTime(value: string) {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw ?? 0);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  inputRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
  },
  inputText: {
    ...typography.body,
    flex: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  option: {
    width: '30.9%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  optionText: {
    ...typography.label,
  },
});
