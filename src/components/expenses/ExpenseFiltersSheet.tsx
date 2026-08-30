import { ArrowLeft, Check, ChevronRight, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { spacing } from '@/constants/spacing';
import { expenseGridColumns } from '@/constants/expenses';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { FilterableColumn } from '@/hooks/useColumnFilters';
import type { ExpenseColumnKey } from '@/types/expenses';

type ExpenseFiltersSheetProps = {
  visible: boolean;
  onClose: () => void;
  onApply: () => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  filters: Partial<Record<ExpenseColumnKey, string[]>>;
  onOpenColumnFilter: (column: FilterableColumn<ExpenseColumnKey>) => void;
  onReset: () => void;
  activeColumn: FilterableColumn<ExpenseColumnKey> | null;
  activeValues: string[];
  pendingValues: string[];
  filterSearch: string;
  onFilterSearchChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  onCloseColumnFilter: () => void;
  onClearColumnFilter: () => void;
  onApplyColumnFilter: () => void;
};

export function ExpenseFiltersSheet({
  visible,
  onClose,
  onApply,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  filters,
  onOpenColumnFilter,
  onReset,
  activeColumn,
  activeValues,
  pendingValues,
  filterSearch,
  onFilterSearchChange,
  onToggleValue,
  onCloseColumnFilter,
  onClearColumnFilter,
  onApplyColumnFilter,
}: ExpenseFiltersSheetProps) {
  const { colors } = useTheme();
  const isDetailView = Boolean(activeColumn);

  const handleFullClose = () => {
    onCloseColumnFilter();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleFullClose}
      title={isDetailView ? `Filter ${activeColumn!.label}` : 'Filter Expenses'}
      footer={
        isDetailView ? (
          <View style={styles.sheetFooter}>
            <Button label="Clear" variant="outline" onPress={onClearColumnFilter} style={styles.footerButton} />
            <Button label="Done" onPress={onApplyColumnFilter} style={styles.footerButton} />
          </View>
        ) : (
          <View style={styles.sheetFooter}>
            <Button label="Reset" variant="outline" onPress={onReset} style={styles.footerButton} />
            <Button label="Apply Filters" onPress={onApply} style={styles.footerButton} />
          </View>
        )
      }
    >
      {isDetailView ? (
        <View style={styles.list}>
          <Pressable
            onPress={onCloseColumnFilter}
            style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
          >
            <ArrowLeft size={16} color={colors.primary} />
            <Text style={[typography.label, { color: colors.primary }]}>All Filters</Text>
          </Pressable>

          <Input
            placeholder="Search filter values"
            value={filterSearch}
            onChangeText={onFilterSearchChange}
            leftIcon={<Search size={18} color={colors.muted} />}
          />
          {activeValues.map((value) => {
            const selected = pendingValues.includes(value);
            return (
              <Pressable
                key={value}
                onPress={() => onToggleValue(value)}
                style={({ pressed }) => [
                  styles.option,
                  { borderBottomColor: colors.border, backgroundColor: selected ? colors.softOrange : 'transparent' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
                  {value}
                </Text>
                {selected ? <Check size={17} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.form}>
          <DateField label="From Date" value={fromDate} onChangeText={onFromDateChange} />
          <DateField label="To Date" value={toDate} onChangeText={onToDateChange} />
          <View style={styles.filterColumns}>
            {expenseGridColumns.map((column) => {
              const count = filters[column.key]?.length ?? 0;
              return (
                <Pressable
                  key={column.key}
                  onPress={() => onOpenColumnFilter(column)}
                  style={({ pressed }) => [
                    styles.filterColumnRow,
                    { borderBottomColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>{column.label}</Text>
                  <View style={styles.filterColumnRight}>
                    <Text
                      style={[
                        typography.caption,
                        { color: count ? colors.primary : colors.muted },
                      ]}
                    >
                      {count ? `${count} selected` : 'All'}
                    </Text>
                    <ChevronRight size={18} color={colors.muted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
  form: {
    gap: spacing.md,
  },
  filterColumns: {
    gap: 0,
  },
  filterColumnRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterColumnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  list: {
    gap: 0,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    marginBottom: spacing.xs,
  },
  option: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
  },
});
