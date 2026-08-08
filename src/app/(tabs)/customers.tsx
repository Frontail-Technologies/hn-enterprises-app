import { FlashList } from '@shopify/flash-list';
import { Filter, Search } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ColumnFilterSheet } from '@/components/shared/ColumnFilterSheet';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Input } from '@/components/ui/Input';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { customerGridColumns } from '@/constants/customers';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useCustomersGrid } from '@/hooks/useCustomersGrid';

export default function CustomersScreen() {
  const { colors } = useTheme();
  const {
    search,
    setSearch,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    total,
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

  // Narrow tables (few columns, or a wide screen) would otherwise size to
  // their own content and leave blank space beside them - stretch to at
  // least the visible container width so rows always span the full screen.
  const [containerWidth, setContainerWidth] = useState(0);
  const handleTableLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };
  const columnsTotalWidth = customerGridColumns.reduce((total, column) => total + column.width, 0);
  const tableMinWidth = Math.max(columnsTotalWidth, containerWidth);

  return (
    // This screen sits directly inside the (tabs) navigator's docked tab bar,
    // which already reserves its own height in the layout - unlike an
    // overlaid tab bar, content here never renders underneath it, so neither
    // tabBarAware's extra padding nor a bottom safe-area inset is needed.
    // Without them, styles.screen's own paddingBottom is the only bottom gap.
    <Screen edges={[]} contentStyle={styles.screen}>
      <AppHeader title="Customers" subtitle="Search and open customer workspace" />
      <Input
        placeholder="Search customer, BP/TR, mobile or address"
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={18} color={colors.muted} />}
      />

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          {isLoading ? 'Loading customers...' : `Showing ${filteredRows.length} of ${total} records`}
        </Text>
        {isLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            nestedScrollEnabled
            style={styles.horizontalScroll}
            onLayout={handleTableLayout}
          >
            <TableSkeleton columnWidths={customerGridColumns.map((column) => column.width)} />
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            nestedScrollEnabled
            style={styles.horizontalScroll}
            onLayout={handleTableLayout}
          >
            <View style={[styles.table, { minWidth: tableMinWidth }]}>
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

              <FlashList
                style={styles.bodyScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                data={filteredRows}
                keyExtractor={(row) => row.id}
                renderItem={({ item: row }) => (
                  <Reveal stagger={false}>
                    <Pressable
                      disabled={!row.canOpen}
                      onPress={() => openCustomer(row)}
                      style={({ pressed }) => [
                        styles.dataRow,
                        {
                          backgroundColor: colors.card,
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
                  </Reveal>
                )}
                ListFooterComponent={
                  hasNextPage ? (
                    <Pressable
                      onPress={loadMore}
                      disabled={isFetchingNextPage}
                      style={({ pressed }) => [styles.loadMoreRow, { borderColor: colors.border }, pressed && { opacity: 0.72 }]}
                    >
                      {isFetchingNextPage ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[typography.label, { color: colors.primary }]}>Load more</Text>
                      )}
                    </Pressable>
                  ) : null
                }
              />
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
    paddingVertical: spacing.sm,
    // Bleed out of the screen's own horizontal padding so the table itself
    // reaches the screen edges instead of floating in a narrower column.
    marginHorizontal: -20,
  },
  resultText: {
    ...typography.caption,
    paddingHorizontal: 20,
  },
  horizontalScroll: {
    flex: 1,
  },
  table: {
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
  loadMoreRow: {
    minHeight: 44,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
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
