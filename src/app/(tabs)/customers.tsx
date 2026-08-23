import { FlashList } from "@shopify/flash-list";
import { Search, UsersRound } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { ColumnFilterSheet } from "@/components/shared/ColumnFilterSheet";
import { FilterButton } from "@/components/shared/FilterButton";
import { PAGINATION_OVERLAY_SPACE, PaginationOverlay } from "@/components/shared/PaginationOverlay";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import { TableFilterSheet } from "@/components/shared/TableFilterSheet";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { customerGridColumns } from "@/constants/customers";
import { spacing } from "@/constants/spacing";
import { tableDividers, tableMetrics, tableText } from "@/constants/table";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useCustomersGrid } from "@/hooks/useCustomersGrid";
import type { CustomerGridColumnKey, CustomerGridRow } from "@/types/customers";
import { formatCount } from "@/utils/format";

const EM_DASH = "—";

// Status and Supervisor stay filterable (TableFilterSheet still uses the
// full customerGridColumns) but aren't shown as table columns - this is the
// subset actually rendered.
const CUSTOMER_TABLE_COLUMNS = customerGridColumns.filter(
  (column) => column.key !== "status" && column.key !== "supervisorName",
);

// Every column gets its own generously-sized fixed width (already curated in
// customerGridColumns for exactly this purpose) and the table scrolls
// horizontally instead of squeezing columns to fit the phone width - so a
// cell only ever truncates if its own content is wider than that column's
// deliberately-chosen width, not because the screen ran out of room.
const CUSTOMER_TABLE_WIDTH = CUSTOMER_TABLE_COLUMNS.reduce(
  (total, column) => total + column.width,
  0,
);

export default function CustomersScreen() {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const {
    search,
    setSearch,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    total,
    filteredRows,
    openCustomer,
    filters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
  } = useCustomersGrid();

  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const hasQueryOrFilter = search.trim().length > 0 || activeFilterCount > 0;
  const showSpinner = filteredRows.length > 0 && isFetchingNextPage;
  const showRetry = filteredRows.length > 0 && !isFetchingNextPage && isError && hasNextPage;
  const showPaginationFooter = showSpinner || showRetry;

  return (
    <Screen edges={[]} contentStyle={styles.screen} revealContent={false}>
      <AppHeader title="Customers" />

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Input
            placeholder="Search customer, BP/TR, mobile or address"
            value={search}
            onChangeText={setSearch}
            leftIcon={<Search size={18} color={colors.muted} />}
          />
        </View>
        <FilterButton
          activeCount={activeFilterCount}
          onPress={() => setFilterMenuOpen(true)}
        />
      </View>

      <Text style={[styles.resultText, { color: colors.muted }]}>
        {isLoading ? "Loading customers…" : formatCount(filteredRows.length, total, "customers")}
      </Text>

      <View style={styles.tableCard}>
        {isLoading ? (
          <TableSkeleton
            columnWidths={CUSTOMER_TABLE_COLUMNS.map((column) => column.width)}
            rowHeight={tableMetrics.rowHeight}
            headerHeight={tableMetrics.headerHeight}
          />
        ) : (
          <ScrollableTable
            listMode
            minWidth={CUSTOMER_TABLE_WIDTH}
            header={
              <View
                style={[
                  styles.headerRow,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderBottomColor: dividers.header,
                  },
                ]}
              >
                {CUSTOMER_TABLE_COLUMNS.map((column, index) => (
                  <View
                    key={column.key}
                    style={[
                      styles.cell,
                      index < CUSTOMER_TABLE_COLUMNS.length - 1 &&
                        styles.cellDivider,
                      { width: column.width, borderRightColor: dividers.vertical },
                    ]}
                  >
                    <Text
                      style={[styles.headerText, { color: colors.muted }]}
                      numberOfLines={1}
                    >
                      {column.label}
                    </Text>
                  </View>
                ))}
              </View>
            }
          >
            <FlashList
              style={styles.bodyScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              data={filteredRows}
              keyExtractor={(row) => row.id}
              renderItem={({ item: row }) => (
                <CustomerTableRow
                  row={row}
                  onOpen={openCustomer}
                  verticalDivider={dividers.vertical}
                />
              )}
              contentContainerStyle={showPaginationFooter ? styles.listContentWithFooter : styles.listContent}
              onEndReachedThreshold={0.4}
              onEndReached={loadMore}
              ListEmptyComponent={
                <EmptyState
                  fill
                  icon={<UsersRound size={22} color={colors.primary} />}
                  title={
                    hasQueryOrFilter
                      ? "No matching customers"
                      : "No customers yet"
                  }
                  description={
                    hasQueryOrFilter
                      ? "Try changing or clearing your search and filters."
                      : "Customers assigned to you will appear here."
                  }
                />
              }
            />
          </ScrollableTable>
        )}

        {/* Sibling of the horizontally-scrollable ScrollableTable, not a
            child of it - stays centered on the device viewport regardless
            of horizontal scroll position (see PaginationOverlay). */}
        <PaginationOverlay
          isFetchingNextPage={showSpinner}
          showRetry={showRetry}
          onRetry={loadMore}
        />
      </View>

      <TableFilterSheet
        visible={filterMenuOpen}
        onClose={() => setFilterMenuOpen(false)}
        columns={customerGridColumns}
        filters={filters}
        onPickColumn={(column) => {
          setFilterMenuOpen(false);
          openFilter(column);
        }}
        onClearAll={() => {
          clearAllFilters();
          setFilterMenuOpen(false);
        }}
      />

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

const EMPHASIZED_COLUMN_STYLE: Partial<Record<CustomerGridColumnKey, keyof typeof styles>> = {
  trBpNo: "bpText",
  customerName: "nameText",
};

function CustomerTableRow({
  row,
  onOpen,
  verticalDivider,
}: {
  row: CustomerGridRow;
  onOpen: (row: CustomerGridRow) => void;
  verticalDivider: string;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      disabled={!row.canOpen}
      onPress={() => onOpen(row)}
      style={({ pressed }) => [
        styles.dataRow,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          opacity: !row.canOpen ? 0.6 : pressed ? 0.62 : 1,
        },
      ]}
    >
      {CUSTOMER_TABLE_COLUMNS.map((column, index) => {
        const emphasized = EMPHASIZED_COLUMN_STYLE[column.key];

        return (
          <View
            key={column.key}
            style={[
              styles.cell,
              index < CUSTOMER_TABLE_COLUMNS.length - 1 && styles.cellDivider,
              { width: column.width, borderRightColor: verticalDivider },
            ]}
          >
            <Text
              style={[
                emphasized ? styles[emphasized] : styles.cellText,
                { color: emphasized ? colors.text : colors.muted },
              ]}
              numberOfLines={1}
            >
              {row[column.key] || EM_DASH}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
  resultText: {
    ...typography.caption,
  },
  tableCard: {
    flex: 1,
  },
  bodyScroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    height: tableMetrics.headerHeight,
    borderBottomWidth: 1,
  },
  headerText: {
    ...tableText.header,
  },
  dataRow: {
    flexDirection: "row",
    height: tableMetrics.rowHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    justifyContent: "center",
    paddingHorizontal: tableMetrics.cellPaddingH,
  },
  cellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  bpText: {
    ...tableText.medium,
  },
  nameText: {
    ...tableText.primary,
  },
  cellText: {
    ...tableText.secondary,
  },
  // flexGrow (not flex): lets the content area grow to fill the viewport
  // when content is shorter than it (the empty state), which is what the
  // EmptyState's own `fill` (flex: 1) needs to actually have space to
  // center within. No-op once real rows make the content taller than the
  // viewport, so this doesn't affect normal scrolling.
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  // Extra bottom space so the last row never sits underneath the viewport-
  // centered PaginationOverlay (see the tableCard wrapper below).
  listContentWithFooter: {
    flexGrow: 1,
    paddingBottom: spacing.md + PAGINATION_OVERLAY_SPACE,
  },
});
