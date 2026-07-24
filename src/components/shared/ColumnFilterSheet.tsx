import { Check, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { FilterableColumn } from '@/hooks/useColumnFilters';

type ColumnFilterSheetProps<K extends string> = {
  activeColumn: FilterableColumn<K> | null;
  activeValues: string[];
  pendingValues: string[];
  filterSearch: string;
  onSearchChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
};

export function ColumnFilterSheet<K extends string>({
  activeColumn,
  activeValues,
  pendingValues,
  filterSearch,
  onSearchChange,
  onToggleValue,
  onClose,
  onClear,
  onApply,
}: ColumnFilterSheetProps<K>) {
  const { colors } = useTheme();

  return (
    <Sheet
      visible={Boolean(activeColumn)}
      onClose={onClose}
      title={activeColumn ? `Filter ${activeColumn.label}` : 'Filter'}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button label="Clear" variant="outline" onPress={onClear} style={styles.footerButton} />
          <Button label="Apply" onPress={onApply} style={styles.footerButton} />
        </View>
      }
    >
      <View style={styles.list}>
        <Input
          placeholder="Search filter values"
          value={filterSearch}
          onChangeText={onSearchChange}
          leftIcon={<Search size={18} color={colors.muted} />}
        />
        {activeValues.map((value) => {
          const selected = pendingValues.includes(value);
          return (
            <Pressable
              key={value}
              onPress={() => onToggleValue(value)}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? colors.softOrange : colors.card,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[typography.body, { color: colors.text }]} numberOfLines={2}>
                {value}
              </Text>
              {selected ? <Check size={17} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
