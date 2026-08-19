import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { statsApi } from "@/services/mobileStats";
import { queryKeys } from "./keys";

export function useSupervisorStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: () => statsApi.getSummary(),
  });
}

const STAT_DETAILS_PAGE_SIZE = 50;

export function useSupervisorStatDetailsQuery(type: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.stats.detailsInfinite(type ?? ""),
    queryFn: ({ pageParam }) => statsApi.getDetailsPage(type as string, { page: pageParam, limit: STAT_DETAILS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(type),
  });
}
