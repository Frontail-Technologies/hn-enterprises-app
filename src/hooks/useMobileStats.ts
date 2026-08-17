import { useSupervisorStatDetailsQuery, useSupervisorStatsQuery } from "@/queries";

export function useSupervisorStats() {
  const query = useSupervisorStatsQuery();

  return {
    stats: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}

export function useSupervisorStatDetails(type: string | undefined) {
  const query = useSupervisorStatDetailsQuery(type);
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? 0;

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  };

  return {
    rows,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    loadMore,
    refetch: query.refetch,
    error: query.error instanceof Error ? query.error : null,
  };
}
