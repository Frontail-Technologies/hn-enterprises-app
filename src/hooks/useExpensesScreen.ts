import { useEffect, useMemo, useRef, useState } from 'react';

import { expenseGridColumns } from '@/constants/expenses';
import { useColumnFilters } from '@/hooks/useColumnFilters';
import { useExpenseFilterValuesQuery, useExpensesInfiniteQuery, useExpensesSummaryQuery } from '@/queries';
import type { ExpenseCategory } from '@/services/expenses.service';
import { dedupeById } from '@/utils/dedupeById';

const ALL_MONTHS = 'All';
const SEARCH_DEBOUNCE_MS = 350;

function monthLabel(monthKey: string) {
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(`${monthKey}-01T00:00:00`));
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | null>(null);
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);

  // Search now hits the server (paginated results can't be filtered
  // client-side), so debounce it instead of firing a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // The explicit From/To pickers and the quick Month select both narrow the
  // same window - intersect them into one range since the backend only
  // takes a single `from`/`to` pair.
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
    clearAllFilters,
    activeFilterCount,
  } = useColumnFilters(expenseGridColumns, []);

  // Every server dataset filter the All Expenses list actually applies:
  // search, date range, category (single-value drill-down), and the column-
  // filter checkboxes (purpose/paidTo/address/amount/date/status).
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
  // True while what's on screen is stale placeholder data left over from the
  // previous search/category/filter, with the real result for the *current*
  // one still in flight. `isLoading` alone doesn't catch this - keepPreviousData
  // (see useExpensesInfiniteQuery) means there's always *some* data once the
  // very first fetch has happened, so isLoading stays false. Without this, a
  // category tap left the old filtered rows sitting on screen untouched
  // until the new page arrived, then jumped - reading as the app being slow
  // rather than loading.
  const isRefiltering = expensesQuery.isPlaceholderData && expensesQuery.isFetching;

  // isFetchingNextPage only flips after a render, so a burst of onScroll
  // events (nested scroll views fire these often) can call loadMore several
  // times before that catches up - this ref-based lock closes that gap.
  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = expensesQuery.isFetchingNextPage;
  }, [expensesQuery.isFetchingNextPage]);

  // Dedupe by id as a safety net - unstable sort tie-breaks on the backend
  // (or any other pagination hiccup) could otherwise hand back the same
  // payment on two pages, which would crash the list on a duplicate key.
  const expenses = useMemo(
    () => dedupeById(expensesQuery.data?.pages.flatMap((page) => page.expenses) ?? []),
    [expensesQuery.data],
  );
  // Every server filter already applied - what's on screen IS the filtered
  // set, nothing further needs to run client-side.
  const filteredExpenses = expenses;

  // Overview tab's own dataset-wide aggregate - deliberately scoped to
  // search/date only (no category/column filters), so tapping a category
  // for the All Expenses drill-down can never collapse Overview's totals to
  // that one slice. See payments.service.ts#summary on the backend.
  const overviewSummaryQuery = useExpensesSummaryQuery({ search: debouncedSearch || undefined, from: effectiveFrom, to: effectiveTo });

  // Genuinely unscoped (no params at all) - distinguishes "you have zero
  // expenses, ever" from "your search/date/filters matched nothing", which
  // `overviewSummaryQuery`/`listSummaryQuery` can't do on their own since
  // they're scoped by whatever the user has currently typed/picked. Only
  // `.count` is read, so `totalsOnly` skips the unused categoryBreakdown/
  // recent sub-queries.
  const hasAnyExpensesQuery = useExpensesSummaryQuery({}, { totalsOnly: true });
  const hasAnyExpenses = (hasAnyExpensesQuery.data?.count ?? 0) > 0;
  // The Overview tab's own loading/error state - scoped to the two queries
  // it actually reads (this one and overviewSummaryQuery above), not the
  // unrelated All Expenses list query. Overview used to be gated on the
  // list's isLoading/isError, which settle independently - whichever of the
  // two resolved first left Overview rendering its empty-state fallback
  // (zero data) for a frame before the real summary arrived.
  const overviewLoading = hasAnyExpensesQuery.isLoading || overviewSummaryQuery.isLoading;
  const overviewError = hasAnyExpensesQuery.isError || overviewSummaryQuery.isError;

  // All Expenses' own "N of Y expenses - Rs total" line - the FULL active
  // filter set, so this figure matches exactly what's on screen, computed
  // over the whole server-filtered dataset rather than loaded pages. Only
  // `.total` is read (recordsTotal below covers the count from the list
  // query's own pagination meta), so this is the other `totalsOnly` caller -
  // this one fires on every category tap, so skipping the unused
  // categoryBreakdown groupBy/recent-5 lookup is what actually shortens that
  // wait.
  const listSummaryQuery = useExpensesSummaryQuery(listParams, { totalsOnly: true });
  const recordsTotal = expensesQuery.data?.pages[0]?.pagination.total ?? 0;
  const total = listSummaryQuery.data?.total ?? 0;

  // Authoritative option universe for whichever column-filter sheet is
  // open - status/category are canonical enums (no request needed); the
  // free-text/numeric columns hit payments.service.ts#filterValues rather
  // than being derived from whatever pages happen to be loaded.
  const filterValuesQuery = useExpenseFilterValuesQuery(activeColumn?.key ?? 'purpose', Boolean(activeColumn));
  const activeValues = useMemo(() => {
    const query = filterSearch.trim().toLowerCase();
    const values = filterValuesQuery.data ?? [];
    return query ? values.filter((value) => value.toLowerCase().includes(query)) : values;
  }, [filterValuesQuery.data, filterSearch]);

  // Built from currently loaded pages, not the full server-filtered
  // dataset, so the list of selectable months can only grow as more pages
  // load in - a known, disclosed limitation (this is a navigation aid, not
  // a business total); a dataset-wide answer would need its own aggregate.
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

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    clearAllFilters();
    setFilterSheetOpen(false);
  };

  const loadMore = () => {
    if (!expensesQuery.hasNextPage || isFetchingRef.current) return;
    isFetchingRef.current = true;
    void expensesQuery.fetchNextPage();
  };

  // Overview's own retry - refetches the two queries it actually depends on
  // (see overviewLoading/overviewError above), not the unrelated list query.
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
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
    clearAllFilters,
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
