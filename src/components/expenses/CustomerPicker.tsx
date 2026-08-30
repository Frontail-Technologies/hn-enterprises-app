import { Check, ChevronDown, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { CustomerOption } from '@/services/customers.service';

const EM_DASH = '—';

type CustomerPickerProps = {
  // The selected customer's full option (not just an id) - the caller needs
  // both id and siteId out of a selection, and the trigger needs the name to
  // display, so there's no separate options[] lookup to keep in sync.
  value: CustomerOption | null;
  options: CustomerOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (option: CustomerOption) => void;
  onClear: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
};

// Purpose-built rather than reusing SimpleSelect: a customer needs three
// lines to be reliably identified (name, TR/BP, address) - SimpleSelect's
// single-line option row has no room for that, and generalizing it would
// touch every other picker in the app (Category, Payment Mode, Status,
// Plumber) for a need only this one field has.
export function CustomerPicker({
  value,
  options,
  open,
  onOpenChange,
  onChange,
  onClear,
  search,
  onSearchChange,
  loading = false,
  error = false,
  onRetry,
}: CustomerPickerProps) {
  const { colors } = useTheme();

  return (
    <>
      <Pressable onPress={() => onOpenChange(true)} style={styles.trigger}>
        <View style={[styles.triggerBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.triggerCopy}>
            <Text style={[styles.label, { color: colors.muted }]}>Customer (optional)</Text>
            <Text style={[styles.value, { color: value ? colors.text : colors.muted }]} numberOfLines={1}>
              {value?.name ?? 'Select customer'}
            </Text>
          </View>
          <ChevronDown size={17} color={colors.muted} />
        </View>
        {value ? (
          <Pressable onPress={onClear} hitSlop={8} style={styles.clearButton}>
            <Text style={[typography.label, { color: colors.primary }]}>Clear</Text>
          </Pressable>
        ) : null}
      </Pressable>

      <Sheet visible={open} onClose={() => onOpenChange(false)} title="Select Customer">
        <View style={styles.sheetBody}>
          <Input
            autoFocus
            placeholder="Search name, TR/BP or address"
            value={search}
            onChangeText={onSearchChange}
            leftIcon={<Search size={18} color={colors.muted} />}
          />

          {loading ? (
            <View style={styles.stateBlock}>
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} height={64} borderRadius={radius.sm} />
              ))}
            </View>
          ) : error ? (
            <ErrorState title="Couldn't load customers" description="Check your connection and try again." onRetry={onRetry} />
          ) : options.length === 0 ? (
            <EmptyState
              title={search.trim() ? 'No matching customers' : 'No customers available'}
              description={search.trim() ? 'Try a different search.' : undefined}
            />
          ) : (
            <View style={styles.options}>
              {options.map((option) => {
                const active = option.id === value?.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onChange(option);
                      onOpenChange(false);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      { borderBottomColor: colors.border, backgroundColor: active ? colors.softOrange : 'transparent' },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <Text style={[styles.optionName, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
                        {option.name}
                      </Text>
                      <Text style={[styles.optionMeta, { color: colors.muted }]} numberOfLines={1}>
                        {option.trBpNo || EM_DASH}
                      </Text>
                      <Text style={[styles.optionMeta, { color: colors.muted }]} numberOfLines={1}>
                        {option.address || EM_DASH}
                      </Text>
                    </View>
                    {active ? <Check size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  triggerBox: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 14,
  },
  triggerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  clearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  sheetBody: {
    gap: spacing.sm,
  },
  stateBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  options: {
    gap: 0,
  },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  optionName: {
    ...typography.bodyMedium,
    fontSize: 14,
  },
  optionMeta: {
    ...typography.caption,
    fontSize: 11.5,
  },
});
