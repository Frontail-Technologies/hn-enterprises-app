import { ArrowLeft, Check, ChevronRight, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { FilterableColumn } from '@/hooks/useColumnFilters';

type TableFilterSheetProps<K extends string> = {
  visible: boolean;
  onClose: () => void;
  columns: FilterableColumn<K>[];
  filters: Partial<Record<K, string[]>>;
  onClearAll: () => void;
  // Column drill-down - rendered as a second view inside this same Sheet
  // (not a second stacked BottomSheetModal - @gorhom/bottom-sheet v5 doesn't
  // reliably keep an earlier presented modal visible/interactive once a
  // second one is presented on top of it here, the same issue already
  // worked around this same way in ExpenseFiltersSheet). Picking a column
  // switches the view in place; the sheet itself never closes.
  activeColumn: FilterableColumn<K> | null;
  activeValues: string[];
  pendingValues: string[];
  filterSearch: string;
  onOpenColumnFilter: (column: FilterableColumn<K>) => void;
  onSearchChange: (value: string) => void;
  onToggleValue: (value: string) => void;
  onCloseColumnFilter: () => void;
  onClearColumnFilter: () => void;
  onApplyColumnFilter: () => void;
};

export function TableFilterSheet<K extends string>({
  visible,
  onClose,
  columns,
  filters,
  onClearAll,
  activeColumn,
  activeValues,
  pendingValues,
  filterSearch,
  onOpenColumnFilter,
  onSearchChange,
  onToggleValue,
  onCloseColumnFilter,
  onClearColumnFilter,
  onApplyColumnFilter,
}: TableFilterSheetProps<K>) {
  const { colors } = useTheme();
  const anyActive = columns.some((column) => filters[column.key]?.length);
  const isDetailView = Boolean(activeColumn);

  // The sheet's own close (X button, backdrop tap, hardware back) always
  // fully closes - it also resets any in-progress column drill-down so the
  // next open starts back at the column list, not wherever the user last
  // left off. Going "back" to the column list *without* closing is the
  // separate, explicit back row below.
  const handleFullClose = () => {
    onCloseColumnFilter();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleFullClose}
      title={isDetailView ? `Filter ${activeColumn!.label}` : 'Filters'}
      sentryName="customer_filters"
      footer={
        isDetailView ? (
          <View style={styles.footer}>
            <Button label="Clear" variant="outline" onPress={onClearColumnFilter} style={styles.footerButton} />
            <Button label="Apply" onPress={onApplyColumnFilter} style={styles.footerButton} />
          </View>
        ) : (
          <View style={styles.footer}>
            {anyActive ? (
              <Button label="Clear all" variant="outline" onPress={onClearAll} style={styles.footerButton} />
            ) : null}
            <Button label="Done" onPress={onClose} style={styles.footerButton} />
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

          {activeValues.length > 8 || filterSearch.length > 0 ? (
            <Input
              placeholder="Search filter values"
              value={filterSearch}
              onChangeText={onSearchChange}
              leftIcon={<Search size={18} color={colors.muted} />}
            />
          ) : null}
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
        <View style={styles.list}>
          {columns.map((column) => {
            const count = filters[column.key]?.length ?? 0;
            return (
              <Pressable
                key={column.key}
                onPress={() => onOpenColumnFilter(column)}
                style={({ pressed }) => [
                  styles.row,
                  { borderBottomColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[typography.body, { color: colors.text }]}>{column.label}</Text>
                <View style={styles.rowRight}>
                  <Text style={[typography.caption, { color: count ? colors.primary : colors.muted }]}>
                    {count ? `${count} selected` : 'All'}
                  </Text>
                  <ChevronRight size={18} color={colors.muted} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
