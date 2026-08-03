import { useWorkProgressHistoryQuery, useWorkQueueQuery } from "@/queries";

export function useWorkQueue() {
  const query = useWorkQueueQuery();

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}

export function useWorkProgressHistory(customerId: string | undefined) {
  const query = useWorkProgressHistoryQuery(customerId);

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch: query.refetch,
  };
}
