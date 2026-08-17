import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
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
  onPickColumn: (column: FilterableColumn<K>) => void;
  onClearAll: () => void;
};

export function TableFilterSheet<K extends string>({
  visible,
  onClose,
  columns,
  filters,
  onPickColumn,
  onClearAll,
}: TableFilterSheetProps<K>) {
  const { colors } = useTheme();
  const anyActive = columns.some((column) => filters[column.key]?.length);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      footer={
        <View style={styles.footer}>
          {anyActive ? (
            <Button label="Clear all" variant="outline" onPress={onClearAll} style={styles.footerButton} />
          ) : null}
          <Button label="Done" onPress={onClose} style={styles.footerButton} />
        </View>
      }
    >
      <View style={styles.list}>
        {columns.map((column) => {
          const count = filters[column.key]?.length ?? 0;
          return (
            <Pressable
              key={column.key}
              onPress={() => onPickColumn(column)}
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
