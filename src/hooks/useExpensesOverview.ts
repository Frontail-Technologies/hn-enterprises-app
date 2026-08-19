import { useMemo } from 'react';

import { expenseCategoryOptions, type ExpenseCategory, type ExpenseRecord, type ExpenseSummary } from '@/services/expenses.service';

export type CategoryBreakdownItem = {
  category: ExpenseCategory;
  label: string;
  count: number;
  total: number;
};

const CATEGORY_LABEL_BY_VALUE = new Map(expenseCategoryOptions.map((option) => [option.value, option.label]));

// Shapes the server-computed summary (expensesApi.summary - authoritative
// over the whole search/date-filtered dataset, not just loaded pages) into
// what the Overview tab renders. No aggregation happens here anymore - see
// payments.service.ts#summary on the backend for where the real counting is.
export function useExpensesOverview(summary: ExpenseSummary | undefined) {
  return useMemo(() => {
    const categoryBreakdown: CategoryBreakdownItem[] = (summary?.categoryBreakdown ?? [])
      .map((item) => ({
        category: item.category,
        label: CATEGORY_LABEL_BY_VALUE.get(item.category) ?? item.category,
        count: item.count,
        total: item.total,
      }))
      .sort((a, b) => b.total - a.total);

    const recentExpenses: ExpenseRecord[] = summary?.recent ?? [];

    return { filteredTotal: summary?.total ?? 0, categoryBreakdown, recentExpenses };
  }, [summary]);
}
