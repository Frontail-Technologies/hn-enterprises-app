import { useEffect, useMemo, useRef, useState } from 'react';

import { expenseGridColumns } from '@/constants/expenses';
import { useColumnFilters } from '@/hooks/useColumnFilters';
import { useExpenseFilterValuesQuery, useExpensesInfiniteQuery, useExpensesSummaryQuery } from '@/queries';
import type { ExpenseCategory } from '@/services/expenses.service';
import { dedupeById } from '@/utils/dedupeById';

const ALL_MONTHS = 'All';
const SEARCH_DEBOUNCE_MS = 350;

function monthLabel(monthKey: string) {
  const parsed = new Date(`${monthKey}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return monthKey;
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(parsed);
}

function monthRange(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${monthKey}-01`, to: `${monthKey}-${String(lastDay).padStart(2, '0')}` };
}

export function useExpensesScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [draftFromDate, setDraftFromDate] = useState('');
  const [draftToDate, setDraftToDate] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | null>(null);
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { from: effectiveFrom, to: effectiveTo } = useMemo(() => {
    let from = fromDate || undefined;
    let to = toDate || undefined;
    if (monthFilter !== ALL_MONTHS) {
      const range = monthRange(monthFilter);
      from = from && from > range.from ? from : range.from;
      to = to && to < range.to ? to : range.to;
    }
    return { from, to };
  }, [fromDate, toDate, monthFilter]);

  const {
    filters,
    draftFilters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
    commitFilters,
    discardDraft,
    resetAllFilters,
    activeFilterCount,
  } = useColumnFilters(expenseGridColumns, []);

  const listParams = {
    search: debouncedSearch || undefined,
    category: categoryFilter ?? undefined,
    from: effectiveFrom,
    to: effectiveTo,
    columnFilters: filters,
  };

  const expensesQuery = useExpensesInfiniteQuery(listParams);
  const isLoading = expensesQuery.isLoading;
  const isError = expensesQuery.isError;
  const isRefiltering = expensesQuery.isPlaceholderData && expensesQuery.isFetching;

  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = expensesQuery.isFetchingNextPage;
  }, [expensesQuery.isFetchingNextPage]);

  const expenses = useMemo(
    () => dedupeById(expensesQuery.data?.pages.flatMap((page) => page.expenses) ?? []),
    [expensesQuery.data],
  );
  const filteredExpenses = expenses;

  const overviewSummaryQuery = useExpensesSummaryQuery({ search: debouncedSearch || undefined, from: effectiveFrom, to: effectiveTo });

  const hasAnyExpensesQuery = useExpensesSummaryQuery({}, { totalsOnly: true });
  const hasAnyExpenses = (hasAnyExpensesQuery.data?.count ?? 0) > 0;
  const overviewLoading = hasAnyExpensesQuery.isLoading || overviewSummaryQuery.isLoading;
  const overviewError = hasAnyExpensesQuery.isError || overviewSummaryQuery.isError;

  const listSummaryQuery = useExpensesSummaryQuery(listParams, { totalsOnly: true });
  const recordsTotal = expensesQuery.data?.pages[0]?.pagination.total ?? 0;
  const total = listSummaryQuery.data?.total ?? 0;

  const filterValuesQuery = useExpenseFilterValuesQuery(activeColumn?.key ?? 'purpose', Boolean(activeColumn));
  const activeValues = useMemo(() => {
    const query = filterSearch.trim().toLowerCase();
    const values = filterValuesQuery.data ?? [];
    return query ? values.filter((value) => value.toLowerCase().includes(query)) : values;
  }, [filterValuesQuery.data, filterSearch]);

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const expense of expenses) {
      if (expense.date) keys.add(expense.date.slice(0, 7));
    }
    const sorted = Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
    return [
      { label: 'All Time', value: ALL_MONTHS },
      ...sorted.map((value) => ({ value, label: monthLabel(value) })),
    ];
  }, [expenses]);

  const openFilterSheet = () => {
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    setFilterSheetOpen(true);
  };

  const applyFilterSheet = () => {
    setFromDate(draftFromDate);
    setToDate(draftToDate);
    commitFilters();
    setFilterSheetOpen(false);
  };

  const discardFilterSheet = () => {
    setDraftFromDate(fromDate);
    setDraftToDate(toDate);
    discardDraft();
    setFilterSheetOpen(false);
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setDraftFromDate('');
    setDraftToDate('');
    resetAllFilters();
    setFilterSheetOpen(false);
  };

  const loadMore = () => {
    if (!expensesQuery.hasNextPage || isFetchingRef.current) return;
    isFetchingRef.current = true;
    void expensesQuery.fetchNextPage();
  };

  const refetchOverview = () => {
    void hasAnyExpensesQuery.refetch();
    void overviewSummaryQuery.refetch();
  };

  return {
    isLoading,
    isError,
    isRefiltering,
    overviewLoading,
    overviewError,
    isFetchingNextPage: expensesQuery.isFetchingNextPage,
    hasNextPage: expensesQuery.hasNextPage,
    loadMore,
    refetch: expensesQuery.refetch,
    refetchOverview,
    expenses,
    filteredExpenses,
    overviewSummary: overviewSummaryQuery.data,
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
    filters,
    draftFilters,
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
    activeFilterCount,
    resetFilters,
    categoryFilter,
    setCategoryFilter,
    monthFilter,
    setMonthFilter,
    monthOptions,
    monthSelectOpen,
    setMonthSelectOpen,
  };
}
