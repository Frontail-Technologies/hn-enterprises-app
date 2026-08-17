import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  ChevronRight,
  IndianRupee,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useState, useMemo } from "react";

import { AppHeader } from "@/components/shared/AppHeader";
import { ColumnFilterSheet } from "@/components/shared/ColumnFilterSheet";
import { ExpensesOverview } from "@/components/expenses/ExpensesOverview";
import { FilterButton } from "@/components/shared/FilterButton";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import { SectionTabBar } from "@/components/shared/SectionTabBar";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Button } from "@/components/ui/Button";
import { DateField } from "@/components/ui/DateField";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { guardNavigation } from "@/lib/navigation";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { StickyHeaderGroup } from "@/components/ui/StickyHeaderGroup";
import { radius, spacing } from "@/constants/spacing";
import { tableDividers, tableMetrics, tableText } from "@/constants/table";
import { usePlumbersOptionsQuery } from "@/queries";
import {
  expenseGridColumns,
  expenseStatusLabels,
  formatExpenseCategory,
  formatExpenseMode,
} from "@/constants/expenses";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useExpensesOverview } from "@/hooks/useExpensesOverview";
import { useExpensesScreen } from "@/hooks/useExpensesScreen";
import {
  expenseCategoryOptions,
  type ExpenseRecord,
  type ExpenseStatus,
} from "@/services/expenses.service";

const EXPENSE_COL_WIDTH = {
  category: 128,
  paidTo: 130,
  amount: 92,
  date: 98,
  purpose: 148,
  mode: 88,
  address: 178,
  status: 94,
};

const EXPENSE_TABLE_COLUMNS: {
  key: keyof typeof EXPENSE_COL_WIDTH;
  label: string;
}[] = [
  { key: "category", label: "Category" },
  { key: "paidTo", label: "Paid To" },
  { key: "amount", label: "Amount" },
  { key: "date", label: "Date" },
  { key: "purpose", label: "Purpose" },
  { key: "mode", label: "Mode" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status" },
];

const EXPENSE_TABLE_WIDTH = Object.values(EXPENSE_COL_WIDTH).reduce(
  (total, width) => total + width,
  0,
);

type ExpenseColumns = Record<keyof typeof EXPENSE_COL_WIDTH, number>;

function resolveExpenseColumns(containerWidth: number): {
  columns: ExpenseColumns;
  tableWidth: number;
} {
  const fits = containerWidth >= EXPENSE_TABLE_WIDTH;
  const extra = fits ? containerWidth - EXPENSE_TABLE_WIDTH : 0;
  const categoryExtra = Math.round(extra * 0.08);
  const paidToExtra = Math.round(extra * 0.14);
  const purposeExtra = Math.round(extra * 0.42);
  const addressExtra = extra - categoryExtra - paidToExtra - purposeExtra;
  return {
    tableWidth: fits ? containerWidth : EXPENSE_TABLE_WIDTH,
    columns: {
      category: EXPENSE_COL_WIDTH.category + categoryExtra,
      paidTo: EXPENSE_COL_WIDTH.paidTo + paidToExtra,
      amount: EXPENSE_COL_WIDTH.amount,
      date: EXPENSE_COL_WIDTH.date,
      purpose: EXPENSE_COL_WIDTH.purpose + purposeExtra,
      mode: EXPENSE_COL_WIDTH.mode,
      address: EXPENSE_COL_WIDTH.address + addressExtra,
      status: EXPENSE_COL_WIDTH.status,
    },
  };
}

const EM_DASH = "—";

const SCREEN_TABS = [
  { key: "overview", label: "Overview" },
  { key: "all", label: "All Expenses" },
];

const CATEGORY_LABEL_BY_VALUE = new Map(
  expenseCategoryOptions.map((option) => [option.value, option.label]),
);

export default function ExpensesScreen() {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const [activeTab, setActiveTab] = useState<"overview" | "all">("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const { columns, tableWidth } = resolveExpenseColumns(containerWidth);
  const plumbersQuery = usePlumbersOptionsQuery();

  const plumberNameById = useMemo(
    () => new Map((plumbersQuery.data ?? []).map((p) => [p.id, p.name])),
    [plumbersQuery.data],
  );

  const openEditExpense = useCallback((expense: ExpenseRecord) => {
    guardNavigation(() =>
      router.push({ pathname: "/expenses/[id]", params: { id: expense.id } }),
    );
  }, []);

  const {
    isLoading,
    isError,
    expenses,
    filteredExpenses,
    overviewExpenses,
    total,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    filterSheetOpen,
    setFilterSheetOpen,
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
    activeFilterCount,
    resetFilters,
    categoryFilter,
    setCategoryFilter,
    monthFilter,
    setMonthFilter,
    monthOptions,
    monthSelectOpen,
    setMonthSelectOpen,
    refetch,
  } = useExpensesScreen();

  const overview = useExpensesOverview(overviewExpenses);
  const expenseFilterCount =
    activeFilterCount + (fromDate ? 1 : 0) + (toDate ? 1 : 0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCategoryPress = useCallback(
    (category: (typeof expenseCategoryOptions)[number]["value"]) => {
      setCategoryFilter(category);
      setActiveTab("all");
    },
    [setCategoryFilter],
  );

  const categoryFilterLabel = categoryFilter
    ? CATEGORY_LABEL_BY_VALUE.get(categoryFilter)
    : null;

  return (
    <Screen
      scroll={false}
      edges={[]}
      contentStyle={styles.screen}
      revealContent={false}
    >
      <StickyHeaderGroup>
        <AppHeader
          title="Expenses"
          right={
            <Pressable
              onPress={() => guardNavigation(() => router.push("/expenses/new"))}
              style={({ pressed }) => [
                styles.headerAddButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
              hitSlop={6}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.headerAddText}>Add</Text>
            </Pressable>
          }
        />

        <SectionTabBar
          tabs={SCREEN_TABS}
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "overview" | "all")}
        />
      </StickyHeaderGroup>

      {activeTab === "overview" ? (
        <ExpensesOverview
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          hasAnyExpenses={expenses.length > 0}
          monthOptions={monthOptions}
          monthFilter={monthFilter}
          onMonthChange={setMonthFilter}
          monthSelectOpen={monthSelectOpen}
          onMonthSelectOpenChange={setMonthSelectOpen}
          filterCount={expenseFilterCount}
          onFilterPress={() => setFilterSheetOpen(true)}
          filteredTotal={overview.filteredTotal}
          categoryBreakdown={overview.categoryBreakdown}
          recentExpenses={overview.recentExpenses}
          plumberNameById={plumberNameById}
          onCategoryPress={handleCategoryPress}
          onViewAllPress={() => setActiveTab("all")}
        />
      ) : (
        <View style={styles.tablePanel}>
          <View style={styles.topRow}>
            <View style={styles.searchWrap}>
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search expenses..."
                leftIcon={<Search size={18} color={colors.muted} />}
              />
            </View>
            <FilterButton
              activeCount={expenseFilterCount}
              onPress={() => setFilterSheetOpen(true)}
            />
          </View>

          {categoryFilterLabel ? (
            <Pressable
              onPress={() => setCategoryFilter(null)}
              style={({ pressed }) => [
                styles.categoryChip,
                {
                  backgroundColor: colors.softOrange,
                  borderColor: colors.primary,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[typography.caption, { color: colors.primary }]}>
                Category: {categoryFilterLabel}
              </Text>
              <X size={14} color={colors.primary} />
            </Pressable>
          ) : null}

          <Text style={[styles.resultText, { color: colors.muted }]}>
            {isLoading
              ? "Loading expenses..."
              : `${filteredExpenses.length} of ${expenses.length} expenses · Rs. ${Math.round(total).toLocaleString("en-IN")}`}
          </Text>

          <View
            style={styles.tableCard}
            onLayout={(event) =>
              setContainerWidth(event.nativeEvent.layout.width)
            }
          >
            {isLoading ? (
              <TableSkeleton
                columnWidths={Object.values(columns)}
                rowHeight={tableMetrics.rowHeight}
                headerHeight={tableMetrics.headerHeight}
              />
            ) : isError ? (
              <ErrorState
                title="Couldn't load expenses"
                description="Check your connection and try again."
                onRetry={refetch}
              />
            ) : (
              <ScrollableTable
                listMode
                minWidth={tableWidth}
                header={
                  <View
                    style={[
                      styles.tableRow,
                      styles.tableHeader,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderBottomColor: dividers.header,
                      },
                    ]}
                  >
                    {EXPENSE_TABLE_COLUMNS.map((column, index) => (
                      <View
                        key={column.key}
                        style={[
                          styles.cell,
                          index < EXPENSE_TABLE_COLUMNS.length - 1 &&
                            styles.cellDivider,
                          {
                            width: columns[column.key],
                            borderRightColor: dividers.vertical,
                          },
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
                  style={styles.flex}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  data={filteredExpenses}
                  keyExtractor={(expense) => expense.id}
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor={colors.primaryDark}
                      colors={[colors.primaryDark]}
                      progressBackgroundColor={colors.card}
                    />
                  }
                  renderItem={({ item: expense }) => (
                    <ExpenseTableRow
                      expense={expense}
                      plumberNameById={plumberNameById}
                      onEdit={openEditExpense}
                      columns={columns}
                    />
                  )}
                  ListEmptyComponent={
                    <EmptyState
                      icon={<IndianRupee size={22} color={colors.primary} />}
                      title={
                        search.trim() ||
                        expenseFilterCount > 0 ||
                        categoryFilter
                          ? "No matching expenses"
                          : "No expenses yet"
                      }
                      description={
                        search.trim() ||
                        expenseFilterCount > 0 ||
                        categoryFilter
                          ? "Try changing or clearing your search and filters."
                          : "Recorded expenses will appear here."
                      }
                    />
                  }
                />
              </ScrollableTable>
            )}
          </View>
        </View>
      )}

      <Sheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter Expenses"
        footer={
          <View style={styles.sheetFooter}>
            <Button
              label="Reset"
              variant="outline"
              onPress={resetFilters}
              style={styles.footerButton}
            />
            <Button
              label="Apply"
              onPress={() => setFilterSheetOpen(false)}
              style={styles.footerButton}
            />
          </View>
        }
      >
        <View style={styles.form}>
          <DateField
            label="From Date"
            value={fromDate}
            onChangeText={setFromDate}
          />
          <DateField label="To Date" value={toDate} onChangeText={setToDate} />
          <View style={styles.filterColumns}>
            {expenseGridColumns.map((column) => {
              const count = filters[column.key]?.length ?? 0;
              return (
                <Pressable
                  key={column.key}
                  onPress={() => {
                    setFilterSheetOpen(false);
                    openFilter(column);
                  }}
                  style={({ pressed }) => [
                    styles.filterColumnRow,
                    { borderBottomColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>
                    {column.label}
                  </Text>
                  <View style={styles.filterColumnRight}>
                    <Text
                      style={[
                        typography.caption,
                        { color: count ? colors.primary : colors.muted },
                      ]}
                    >
                      {count ? `${count} selected` : "All"}
                    </Text>
                    <ChevronRight size={18} color={colors.muted} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Sheet>

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

function ExpenseTableRow({
  expense,
  plumberNameById,
  onEdit,
  columns,
}: {
  expense: ExpenseRecord;
  plumberNameById: Map<string, string>;
  onEdit: (expense: ExpenseRecord) => void;
  columns: ExpenseColumns;
}) {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const paidTo =
    expense.category === "plumber_payment"
      ? plumberNameById.get(expense.plumberId) || expense.paidTo || EM_DASH
      : expense.paidTo || EM_DASH;

  return (
    <Pressable
      onPress={() => onEdit(expense)}
      style={({ pressed }) => [
        styles.tableRow,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.62 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.category, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.categoryText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formatExpenseCategory(expense.category)}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.paidTo, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.strongText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {paidTo}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.amount, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.amountText, { color: colors.primary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Rs. {Number(expense.amount || 0).toLocaleString("en-IN")}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.date, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.cellText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {expense.date || EM_DASH}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.purpose, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {expense.purpose || EM_DASH}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.mode, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formatExpenseMode(expense.paymentMode)}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.address, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {expense.address || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, { width: columns.status }]}>
        <StatusPill status={expense.status} />
      </View>
    </Pressable>
  );
}

function StatusPill({ status }: { status: ExpenseStatus }) {
  const { colors } = useTheme();
  const tint =
    status === "approved"
      ? colors.softBlue
      : status === "rejected"
        ? colors.softOrange
        : status === "submitted"
          ? colors.softBlue
          : colors.softOrange;
  const textColor =
    status === "approved"
      ? colors.green
      : status === "rejected"
        ? colors.red
        : status === "submitted"
          ? colors.blue
          : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: tint }]}>
      <Text style={[styles.pillText, { color: textColor }]}>
        {expenseStatusLabels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  headerAddButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.button,
  },
  headerAddText: {
    ...typography.label,
    color: "#FFFFFF",
    fontSize: 13,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
  categoryChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 32,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  tablePanel: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  // No visible card chrome here on purpose - the header row's border and each
  // row's own hairline divider give it enough structure; a bordered/filled
  // outer box would extend a big empty surface below the last record.
  tableCard: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  resultText: {
    ...typography.caption,
  },
  tableRow: {
    height: tableMetrics.rowHeight,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    height: tableMetrics.headerHeight,
    borderBottomWidth: 1,
  },
  headerText: {
    ...tableText.header,
  },
  cell: {
    justifyContent: "center",
    paddingHorizontal: tableMetrics.cellPaddingH,
  },
  cellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  categoryText: {
    ...tableText.medium,
  },
  strongText: {
    ...tableText.primary,
  },
  amountText: {
    ...tableText.primary,
    fontVariant: ["tabular-nums"],
  },
  cellText: {
    ...tableText.secondary,
  },
  mutedText: {
    ...tableText.secondary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pillText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
  sheetFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: "auto",
  },
  form: {
    gap: spacing.md,
  },
  filterColumns: {
    gap: 0,
  },
  filterColumnRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterColumnRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
