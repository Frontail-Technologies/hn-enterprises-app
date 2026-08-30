import { router } from "expo-router";
import { PieChart, Plus, Receipt, Search, SlidersHorizontal, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import PagerView from "react-native-pager-view";
import { useCallback, useMemo, useState } from "react";

import { AppHeader } from "@/components/shared/AppHeader";
import { ExpenseFiltersSheet } from "@/components/expenses/ExpenseFiltersSheet";
import { ExpensesList } from "@/components/expenses/ExpensesList";
import { ExpensesOverview } from "@/components/expenses/ExpensesOverview";
import { SectionTabBar } from "@/components/shared/SectionTabBar";
import { Input } from "@/components/ui/Input";
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
  { key: "overview", label: "Overview", icon: PieChart },
  { key: "all", label: "All Expenses", icon: Receipt },
];

const SCREEN_TAB_KEYS = SCREEN_TABS.map((tab) => tab.key);

const CATEGORY_LABEL_BY_VALUE = new Map(
  expenseCategoryOptions.map((option) => [option.value, option.label]),
);

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    activeKey: activeTab,
    pagerRef,
    initialIndex,
    onPageSelected,
    isMounted,
    selectTab: setActiveTab,
  } = useSwipeableTabs(SCREEN_TAB_KEYS);
  // Search only applies to the All Expenses list. Derived rather than reset
  // via an effect - activeTab already updates correctly for both a tap
  // (SectionTabBar -> selectTab) and a swipe (PagerView -> onPageSelected),
  // so gating on it here closes the header's search row on either without
  // an extra render pass.
  const searchExpanded = searchOpen && activeTab === "all";
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
    toDate,
    draftFromDate,
    setDraftFromDate,
    draftToDate,
    setDraftToDate,
    filterSheetOpen,
    openFilterSheet,
    applyFilterSheet,
    discardFilterSheet,
    draftFilters,
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
      tabBarAware
      edges={[]}
      contentStyle={styles.screen}
      revealContent={false}
    >
      <StickyHeaderGroup>
        <AppHeader
          title="Expenses"
          actions={
            searchExpanded
              ? undefined
              : [
                  // Search only applies to the All Expenses list - Overview
                  // is a browse/aggregate view, nothing to search there.
                  ...(activeTab === "all"
                    ? [
                        {
                          key: "search",
                          icon: Search,
                          accessibilityLabel: "Search expenses",
                          onPress: () => setSearchOpen(true),
                        },
                      ]
                    : []),
                  {
                    key: "filter",
                    icon: SlidersHorizontal,
                    accessibilityLabel: "Filter expenses",
                    // Same filter sheet/count both tabs already shared.
                    active: expenseFilterCount > 0,
                    onPress: () => openFilterSheet(),
                  },
                ]
          }
          right={
            searchExpanded ? undefined : (
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
            )
          }
          bottomContent={
            searchExpanded ? (
              <View style={styles.searchRow}>
                <View style={styles.searchWrap}>
                  <Input
                    autoFocus
                    placeholder="Search expenses..."
                    value={search}
                    onChangeText={setSearch}
                    leftIcon={<Search size={18} color={colors.muted} />}
                    rightIcon={search ? <X size={16} color={colors.muted} /> : undefined}
                    onRightIconPress={() => setSearch("")}
                  />
                </View>
                <Pressable onPress={() => setSearchOpen(false)} style={styles.headerAction}>
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : undefined
          }
        />

        <SectionTabBar
          tabs={SCREEN_TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
          fullWidth
          surface
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
              filteredTotal={overview.filteredTotal}
              categoryBreakdown={overview.categoryBreakdown}
              recentExpenses={overview.recentExpenses}
              plumberNameById={plumberNameById}
              onCategoryPress={handleCategoryPress}
              onViewAllPress={() => setActiveTab("all")}
              onExpensePress={openEditExpense}
            />
          ) : null}
        </View>

        <View key="all" style={styles.page}>
          {isMounted("all") ? (
            <ExpensesList
              isLoading={isLoading}
              isRefiltering={isRefiltering}
              isError={isError}
              search={search}
              hasActiveFilters={expenseFilterCount > 0}
              filteredExpenses={filteredExpenses}
              total={total}
              recordsTotal={recordsTotal}
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
        onClose={discardFilterSheet}
        onApply={applyFilterSheet}
        fromDate={draftFromDate}
        onFromDateChange={setDraftFromDate}
        toDate={draftToDate}
        onToDateChange={setDraftToDate}
        filters={draftFilters}
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
  headerAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
});
