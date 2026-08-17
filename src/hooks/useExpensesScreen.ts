import { useMemo, useState } from 'react';

import { expenseGridColumns } from '@/constants/expenses';
import { useColumnFilters } from '@/hooks/useColumnFilters';
import { useExpensesQuery } from '@/queries';
import type { ExpenseCategory } from '@/services/expenses.service';
import type { ExpenseGridRow } from '@/types/expenses';

const ALL_MONTHS = 'All';

function monthLabel(monthKey: string) {
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(`${monthKey}-01T00:00:00`));
}

export function useExpensesScreen() {
  const expensesQuery = useExpensesQuery();
  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);
  const isLoading = expensesQuery.isLoading;
  const isError = expensesQuery.isError;

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | null>(null);
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS);
  const [monthSelectOpen, setMonthSelectOpen] = useState(false);

  // Built from the full loaded set (not the filtered one) so the list of
  // selectable months doesn't shrink as other filters get applied.
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

  const rows = useMemo<ExpenseGridRow[]>(() => expenses, [expenses]);

  const {
    filters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    matchesFilters,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
    clearAllFilters,
    activeFilterCount,
  } = useColumnFilters(expenseGridColumns, rows);

  // Category is deliberately applied as a second pass on top of this, not
  // folded into the same predicate - it's a drill-down into the All Expenses
  // table only. The Overview tab's own totals/donut/breakdown are computed
  // from `overviewExpenses` (below) so tapping a category and coming back to
  // Overview doesn't collapse it down to that one slice.
  const overviewExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((expense) => {
      const matchesFromDate = fromDate ? expense.date >= fromDate : true;
      const matchesToDate = toDate ? expense.date <= toDate : true;
      const matchesMonth = monthFilter === ALL_MONTHS || expense.date.slice(0, 7) === monthFilter;
      const matchesSearch =
        !query ||
        [expense.purpose, expense.paidTo, expense.address, expense.paymentMode, expense.status]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFromDate && matchesToDate && matchesMonth && matchesSearch && matchesFilters(expense);
    });
  }, [rows, fromDate, toDate, monthFilter, matchesFilters, search]);

  const filteredExpenses = useMemo(
    () => overviewExpenses.filter((expense) => !categoryFilter || expense.category === categoryFilter),
    [overviewExpenses, categoryFilter],
  );

  const total = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    clearAllFilters();
    setFilterSheetOpen(false);
  };

  return {
    isLoading,
    isError,
    refetch: expensesQuery.refetch,
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
