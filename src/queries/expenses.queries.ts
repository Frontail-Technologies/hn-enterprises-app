import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { expensesApi, type ExpenseListParams } from "@/services/expenses.service";
import type { ExpenseColumnKey } from "@/types/expenses";
import { queryKeys } from "./keys";
import { nextPageParam } from "./pagination";

type ExpenseInput = Parameters<typeof expensesApi.create>[0];

export function useExpensesQuery() {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => expensesApi.list(),
  });
}

const EXPENSE_PAGE_SIZE = 100;

export function useExpensesInfiniteQuery(params: ExpenseListParams = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.expenses.infiniteList(params),
    queryFn: ({ pageParam }) => expensesApi.listPage({ page: pageParam, limit: EXPENSE_PAGE_SIZE, ...params }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => nextPageParam(lastPage.pagination),
    placeholderData: keepPreviousData,
  });
}

export function useExpensesSummaryQuery(params: ExpenseListParams = {}, options: { totalsOnly?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.expenses.summary({ ...params, totalsOnly: options.totalsOnly }),
    queryFn: () => expensesApi.summary(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseFilterValuesQuery(column: ExpenseColumnKey | "category", enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.expenses.filterValues(column),
    queryFn: () => expensesApi.fetchFilterValues(column),
    enabled,
    staleTime: 60_000,
  });
}

export function useExpenseQuery(id?: string) {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: () => expensesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExpenseInput) => expensesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseInput }) => expensesApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
    },
  });
}
