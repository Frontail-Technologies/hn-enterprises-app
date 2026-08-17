import { Check, ChevronDown, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Input } from '../ui/Input';
import { Sheet } from '../ui/Sheet';
import { Skeleton } from '../ui/Skeleton';

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
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyLabel?: string;
  // Single-line toolbar trigger ("All Time ▾") instead of the default
  // two-line caption-label + value trigger. Sheet/options behavior is shared.
  compact?: boolean;
};

export function SimpleSelect<T extends string>({
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
  searchable = false,
  disabled = false,
  loading = false,
  error = false,
  onRetry,
  emptyLabel,
  compact = false,
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
        disabled={disabled}
        onPress={() => handleOpenChange(true)}
        style={({ pressed }) => [
          styles.trigger,
          compact && styles.triggerCompact,
          { backgroundColor: disabled ? colors.background : colors.card, borderColor: colors.border },
          pressed && !disabled && { opacity: 0.82 },
        ]}
      >
        {compact ? (
          <Text style={[styles.compactValue, { color: disabled ? colors.muted : colors.text }]} numberOfLines={1}>
            {selected?.label ?? value}
          </Text>
        ) : (
          <View style={styles.triggerCopy}>
            <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
            <Text style={[styles.value, { color: disabled ? colors.muted : colors.text }]} numberOfLines={1}>
              {selected?.label ?? value}
            </Text>
          </View>
        )}
        <ChevronDown size={17} color={colors.muted} />
      </Pressable>

      <Sheet visible={open} onClose={() => handleOpenChange(false)} title={label}>
        {loading ? (
          <View style={styles.stateBlock}>
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} height={50} borderRadius={radius.sm} />
            ))}
          </View>
        ) : error ? (
          <ErrorState title="Couldn't load options" description="Check your connection and try again." onRetry={onRetry} />
        ) : options.length === 0 ? (
          <EmptyState title={emptyLabel ?? 'No options available'} />
        ) : (
        <View style={styles.optionsWrap}>
          {searchable ? (
            <Input
              placeholder={`Search ${label.toLowerCase()}`}
              value={query}
              onChangeText={setQuery}
              leftIcon={<Search size={18} color={colors.muted} />}
            />
          ) : null}
          <View style={styles.options}>
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
                  { borderBottomColor: colors.border, backgroundColor: active ? colors.softOrange : 'transparent' },
                  pressed && { opacity: 0.7 },
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
        </View>
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 14,
  },
  triggerCompact: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  triggerCopy: {
    flex: 1,
    gap: 2,
  },
  compactValue: {
    ...typography.label,
    flex: 1,
    fontSize: 13,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  value: {
    ...typography.label,
    fontSize: 13,
  },
  optionsWrap: {
    gap: spacing.sm,
  },
  options: {
    gap: 0,
  },
  stateBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  option: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
  },
  optionText: {
    ...typography.body,
  },
});
