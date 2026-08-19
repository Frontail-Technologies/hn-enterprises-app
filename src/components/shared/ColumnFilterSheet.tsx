import { Check, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { spacing } from '@/constants/spacing';
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
        <View style={styles.footer}>
          <Button label="Clear" variant="outline" onPress={onClear} style={styles.footerButton} />
          <Button label="Apply" onPress={onApply} style={styles.footerButton} />
        </View>
      }
    >
      <View style={styles.list}>
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 0,
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
  // No border/padding here - Sheet's own footerWrap already supplies the top
  // border and padding around whatever `footer` content is passed to it.
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
