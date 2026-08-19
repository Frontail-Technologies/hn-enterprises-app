import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useCallback, useMemo, useState } from "react";

import { AppHeader } from "@/components/shared/AppHeader";
import { ExpenseFiltersSheet } from "@/components/expenses/ExpenseFiltersSheet";
import { ExpensesList } from "@/components/expenses/ExpensesList";
import { ExpensesOverview } from "@/components/expenses/ExpensesOverview";
import { SectionTabBar } from "@/components/shared/SectionTabBar";
import { guardNavigation } from "@/lib/navigation";
import { Screen } from "@/components/ui/Screen";
import { StickyHeaderGroup } from "@/components/ui/StickyHeaderGroup";
import { radius, spacing } from "@/constants/spacing";
import { usePlumbersOptionsQuery } from "@/queries";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useExpensesOverview } from "@/hooks/useExpensesOverview";
import { useExpensesScreen } from "@/hooks/useExpensesScreen";
import { useSwipeableTabs } from "@/hooks/useSwipeableTabs";
import {
  expenseCategoryOptions,
  type ExpenseRecord,
} from "@/services/expenses.service";

const SCREEN_TABS = [
  { key: "overview", label: "Overview" },
  { key: "all", label: "All Expenses" },
];

const SCREEN_TAB_KEYS = SCREEN_TABS.map((tab) => tab.key);

const CATEGORY_LABEL_BY_VALUE = new Map(
  expenseCategoryOptions.map((option) => [option.value, option.label]),
);

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const {
    activeKey: activeTab,
    pagerRef,
    initialIndex,
    onPageSelected,
    isMounted,
    selectTab: setActiveTab,
  } = useSwipeableTabs(SCREEN_TAB_KEYS);
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
    isRefiltering,
    overviewLoading,
    overviewError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    refetchOverview,
    filteredExpenses,
    overviewSummary,
    hasAnyExpenses,
    total,
    recordsTotal,
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

  const overview = useExpensesOverview(overviewSummary);
  const expenseFilterCount =
    activeFilterCount + (fromDate ? 1 : 0) + (toDate ? 1 : 0);

  const handleRefresh = useExpensesRefresh(refetch);

  const handleCategoryPress = useCallback(
    (category: (typeof expenseCategoryOptions)[number]["value"]) => {
      setCategoryFilter(category);
      setActiveTab("all");
    },
    [setCategoryFilter, setActiveTab],
  );

  const categoryFilterLabel = categoryFilter
    ? CATEGORY_LABEL_BY_VALUE.get(categoryFilter) ?? null
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
              onPress={() =>
                guardNavigation(() => router.push("/expenses/new"))
              }
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
          onChange={setActiveTab}
        />
      </StickyHeaderGroup>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
      >
        <View key="overview" style={styles.page}>
          {isMounted("overview") ? (
            <ExpensesOverview
              isLoading={overviewLoading}
              isError={overviewError}
              onRetry={refetchOverview}
              refreshing={handleRefresh.refreshing}
              onRefresh={handleRefresh.onRefresh}
              hasAnyExpenses={hasAnyExpenses}
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
          ) : null}
        </View>

        <View key="all" style={styles.page}>
          {isMounted("all") ? (
            <ExpensesList
              isLoading={isLoading || isRefiltering}
              isError={isError}
              search={search}
              onSearchChange={setSearch}
              filteredExpenses={filteredExpenses}
              total={total}
              recordsTotal={recordsTotal}
              filterCount={expenseFilterCount}
              onFilterPress={() => setFilterSheetOpen(true)}
              categoryFilterLabel={categoryFilterLabel}
              onClearCategoryFilter={() => setCategoryFilter(null)}
              plumberNameById={plumberNameById}
              onEdit={openEditExpense}
              refreshing={handleRefresh.refreshing}
              onRefresh={handleRefresh.onRefresh}
              onRetry={refetch}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={loadMore}
            />
          ) : null}
        </View>
      </PagerView>

      <ExpenseFiltersSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        fromDate={fromDate}
        onFromDateChange={setFromDate}
        toDate={toDate}
        onToDateChange={setToDate}
        filters={filters}
        onOpenColumnFilter={openFilter}
        onReset={resetFilters}
        activeColumn={activeColumn}
        activeValues={activeValues}
        pendingValues={pendingValues}
        filterSearch={filterSearch}
        onFilterSearchChange={setFilterSearch}
        onToggleValue={togglePendingValue}
        onCloseColumnFilter={closeFilter}
        onClearColumnFilter={clearFilter}
        onApplyColumnFilter={applyFilter}
      />
    </Screen>
  );
}

// Small, local, not worth its own file: wraps a `refetch` in the
// refreshing-boolean dance every pull-to-refresh needs, shared by both tabs.
function useExpensesRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
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
});
