import { Check, ChevronDown, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { Input } from '../ui/Input';
import { Sheet } from '../ui/Sheet';

type SimpleSelectOption<T extends string> = {
  label: string;
  value: T;
};

type SimpleSelectProps<T extends string> = {
  label: string;
  value: T;
  options: SimpleSelectOption<T>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: T) => void;
  searchable?: boolean;
};

export function SimpleSelect<T extends string>({
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
  searchable = false,
}: SimpleSelectProps<T>) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);

  const visibleOptions = useMemo(() => {
    if (!searchable) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalized));
  }, [options, query, searchable]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setQuery('');
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Pressable
        onPress={() => handleOpenChange(true)}
        style={({ pressed }) => [
          styles.trigger,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.82 },
        ]}
      >
        <View style={styles.triggerCopy}>
          <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
            {selected?.label ?? value}
          </Text>
        </View>
        <ChevronDown size={17} color={colors.muted} />
      </Pressable>

      <Sheet visible={open} onClose={() => handleOpenChange(false)} title={label}>
        <View style={styles.options}>
          {searchable ? (
            <Input
              placeholder={`Search ${label.toLowerCase()}`}
              value={query}
              onChangeText={setQuery}
              leftIcon={<Search size={18} color={colors.muted} />}
            />
          ) : null}
          {visibleOptions.map((option) => {
            const active = option.value === value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  handleOpenChange(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: active ? colors.softOrange : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                  pressed && { opacity: 0.84 },
                ]}
              >
                <Text style={[styles.optionText, { color: active ? colors.primary : colors.text }]}>
                  {option.label}
                </Text>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 52,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  triggerCopy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  value: {
    ...typography.label,
    fontSize: 13,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    ...typography.body,
  },
});
