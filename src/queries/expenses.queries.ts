import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { expensesApi } from "@/services/expenses.service";
import { queryKeys } from "./keys";

type ExpenseInput = Parameters<typeof expensesApi.create>[0];

export function useExpensesQuery() {
  return useQuery({
    queryKey: queryKeys.expenses.all,
    queryFn: () => expensesApi.list(),
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
