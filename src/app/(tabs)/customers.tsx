import { FlashList } from "@shopify/flash-list";
import { Search, UsersRound } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { ColumnFilterSheet } from "@/components/shared/ColumnFilterSheet";
import { FilterButton } from "@/components/shared/FilterButton";
import { TableFilterSheet } from "@/components/shared/TableFilterSheet";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { customerGridColumns } from "@/constants/customers";
import { radius, spacing } from "@/constants/spacing";
import { tableDividers, tableMetrics, tableText } from "@/constants/table";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useCustomersGrid } from "@/hooks/useCustomersGrid";
import type { CustomerGridRow } from "@/types/customers";

const EM_DASH = "—";

type CustomerColumns = { bp: number; name: number; address: number };

const CUSTOMER_RATIO = { bp: 0.27, name: 0.34 };
const CUSTOMER_MIN = { bp: 88, name: 108, address: 96 };

// Customers is a fixed 3-column table (BP/TR, Customer, Address) that must fill
// the phone width with no horizontal scroll. Widths are derived once from the
// measured table width and passed to header + rows as a stable config, so the
// address column absorbs whatever space the first two don't need.
function resolveCustomerColumns(width: number): CustomerColumns {
  const usable = Math.max(
    width,
    CUSTOMER_MIN.bp + CUSTOMER_MIN.name + CUSTOMER_MIN.address,
  );
  const bp = Math.max(CUSTOMER_MIN.bp, Math.round(usable * CUSTOMER_RATIO.bp));
  const name = Math.max(
    CUSTOMER_MIN.name,
    Math.round(usable * CUSTOMER_RATIO.name),
  );
  const address = Math.max(CUSTOMER_MIN.address, usable - bp - name);
  return { bp, name, address };
}

export default function CustomersScreen() {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
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
  const [containerWidth, setContainerWidth] = useState(0);
  const hasQueryOrFilter = search.trim().length > 0 || activeFilterCount > 0;
  const columns = resolveCustomerColumns(containerWidth);

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
        {isLoading
          ? "Loading customers…"
          : `${filteredRows.length} of ${total} customers`}
      </Text>

      <View
        style={styles.tableCard}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {isLoading || containerWidth === 0 ? (
          <TableSkeleton
            columnWidths={[columns.bp, columns.name, columns.address]}
            rowHeight={tableMetrics.rowHeight}
            headerHeight={tableMetrics.headerHeight}
          />
        ) : (
          <View style={styles.table}>
            <View
              style={[
                styles.headerRow,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderBottomColor: dividers.header,
                },
              ]}
            >
              <View
                style={[
                  styles.cell,
                  styles.cellDivider,
                  { width: columns.bp, borderRightColor: dividers.vertical },
                ]}
              >
                <Text
                  style={[styles.headerText, { color: colors.muted }]}
                  numberOfLines={1}
                >
                  BP / TR
                </Text>
              </View>
              <View
                style={[
                  styles.cell,
                  styles.cellDivider,
                  { width: columns.name, borderRightColor: dividers.vertical },
                ]}
              >
                <Text
                  style={[styles.headerText, { color: colors.muted }]}
                  numberOfLines={1}
                >
                  Customer
                </Text>
              </View>
              <View style={[styles.cell, { width: columns.address }]}>
                <Text
                  style={[styles.headerText, { color: colors.muted }]}
                  numberOfLines={1}
                >
                  Address
                </Text>
              </View>
            </View>

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
                  columns={columns}
                  verticalDivider={dividers.vertical}
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState
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
              ListFooterComponent={
                hasNextPage ? (
                  <Pressable
                    onPress={loadMore}
                    disabled={isFetchingNextPage}
                    style={({ pressed }) => [
                      styles.loadMoreRow,
                      { borderColor: colors.border },
                      pressed && { opacity: 0.72 },
                    ]}
                  >
                    {isFetchingNextPage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={[typography.label, { color: colors.primary }]}
                      >
                        Load more
                      </Text>
                    )}
                  </Pressable>
                ) : null
              }
            />
          </View>
        )}
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

function CustomerTableRow({
  row,
  onOpen,
  columns,
  verticalDivider,
}: {
  row: CustomerGridRow;
  onOpen: (row: CustomerGridRow) => void;
  columns: CustomerColumns;
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
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.bp, borderRightColor: verticalDivider },
        ]}
      >
        <Text style={[styles.bpText, { color: colors.text }]} numberOfLines={1}>
          {row.trBpNo || EM_DASH}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.name, borderRightColor: verticalDivider },
        ]}
      >
        <Text
          style={[styles.nameText, { color: colors.text }]}
          numberOfLines={1}
        >
          {row.customerName || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, { width: columns.address }]}>
        <Text
          style={[styles.addressText, { color: colors.muted }]}
          numberOfLines={1}
        >
          {row.fullAddress || EM_DASH}
        </Text>
      </View>
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
  table: {
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
  addressText: {
    ...tableText.secondary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  loadMoreRow: {
    minHeight: 44,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
