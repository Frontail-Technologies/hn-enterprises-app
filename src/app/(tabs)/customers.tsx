import { Filter, Search } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ColumnFilterSheet } from '@/components/shared/ColumnFilterSheet';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { customerGridColumns } from '@/constants/customers';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useCustomersGrid } from '@/hooks/useCustomersGrid';

export default function CustomersScreen() {
  const { colors } = useTheme();
  const {
    search,
    setSearch,
    isLoading,
    rows,
    filteredRows,
    openCustomer,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
  } = useCustomersGrid();

  return (
    <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="Customers" subtitle="Search and open customer workspace" />
      <Input
        placeholder="Search customer, BP/TR, mobile or address"
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={18} color={colors.muted} />}
      />

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          {isLoading ? 'Loading customers...' : `Showing ${filteredRows.length} of ${rows.length} records`}
        </Text>
        {isLoading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled style={styles.horizontalScroll}>
            <TableSkeleton columnWidths={customerGridColumns.map((column) => column.width)} />
          </ScrollView>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled style={styles.horizontalScroll}>
            <View style={styles.table}>
              <View style={[styles.headerRow, { backgroundColor: colors.softOrange, borderColor: colors.border }]}>
                {customerGridColumns.map((column) => {
                  const active = isColumnActive(column.key);
                  return (
                    <Pressable
                      key={column.key}
                      onPress={() => openFilter(column)}
                      style={[styles.headerCell, { width: column.width, borderColor: colors.border }]}
                    >
                      <Text style={[styles.headerText, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
                        {column.label}
                      </Text>
                      <Filter size={12} color={active ? colors.primary : colors.muted} />
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView style={styles.bodyScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                {filteredRows.map((row) => (
                  <Pressable
                    key={row.id}
                    disabled={!row.canOpen}
                    onPress={() => openCustomer(row)}
                    style={({ pressed }) => [
                      styles.dataRow,
                      {
                        backgroundColor: '#FFFFFF',
                        borderColor: colors.border,
                        opacity: !row.canOpen ? 0.72 : pressed ? 0.62 : 1,
                      },
                    ]}
                  >
                    {customerGridColumns.map((column) => (
                      <View key={column.key} style={[styles.dataCell, { width: column.width, borderColor: colors.border }]}>
                        <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={2}>
                          {String(row[column.key]) || '-'}
                        </Text>
                      </View>
                    ))}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>

      <ColumnFilterSheet
        activeColumn={activeColumn}
        activeValues={activeValues}
        pendingValues={pendingValues}
        filterSearch={filterSearch}
        onSearchChange={setFilterSearch}
        onToggleValue={togglePendingValue}
        onClose={closeFilter}
        onClear={clearFilter}
        onApply={applyFilter}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  tablePanel: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  resultText: {
    ...typography.caption,
    paddingHorizontal: spacing.xs,
  },
  horizontalScroll: {
    flex: 1,
  },
  table: {
    minWidth: customerGridColumns.reduce((total, column) => total + column.width, 0),
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  headerCell: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  headerText: {
    flex: 1,
    ...typography.label,
    fontSize: 10,
    lineHeight: 13,
  },
  bodyScroll: {
    flex: 1,
  },
  dataRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  dataCell: {
    minHeight: 34,
    justifyContent: 'center',
    borderRightWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  cellText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
});
