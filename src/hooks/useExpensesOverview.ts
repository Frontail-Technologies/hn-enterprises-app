import { useMemo } from 'react';

import { expenseCategoryOptions, type ExpenseCategory, type ExpenseRecord } from '@/services/expenses.service';

export type CategoryBreakdownItem = {
  category: ExpenseCategory;
  label: string;
  count: number;
  total: number;
};

const RECENT_EXPENSES_LIMIT = 5;

// Every value here is derived once per `filteredExpenses` change (not on
// every row render) from the already-loaded, already-filtered dataset - no
// extra requests, no per-row recomputation.
export function useExpensesOverview(filteredExpenses: ExpenseRecord[]) {
  return useMemo(() => {
    const buckets = new Map<ExpenseCategory, { count: number; total: number }>();
    let filteredTotal = 0;

    for (const expense of filteredExpenses) {
      const amount = Number(expense.amount) || 0;
      filteredTotal += amount;
      const bucket = buckets.get(expense.category) ?? { count: 0, total: 0 };
      bucket.count += 1;
      bucket.total += amount;
      buckets.set(expense.category, bucket);
    }

    const categoryBreakdown: CategoryBreakdownItem[] = expenseCategoryOptions
      .map((option) => ({
        category: option.value,
        label: option.label,
        count: buckets.get(option.value)?.count ?? 0,
        total: buckets.get(option.value)?.total ?? 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.total - a.total);

    const recentExpenses = [...filteredExpenses]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, RECENT_EXPENSES_LIMIT);

    return { filteredTotal, categoryBreakdown, recentExpenses };
  }, [filteredExpenses]);
}
