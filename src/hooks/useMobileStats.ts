import { useEffect, useRef } from "react";

import { useSupervisorStatDetailsQuery } from "@/queries";

export function useSupervisorStatDetails(type: string | undefined) {
  const query = useSupervisorStatDetailsQuery(type);
  const rows = query.data?.pages.flatMap((page) => page.rows) ?? [];
  const total = query.data?.pages[0]?.pagination.total ?? 0;

  // isFetchingNextPage only flips after a render, so a burst of onScroll
  // events (nested scroll views fire these often) can call loadMore several
  // times before that catches up - this ref-based lock closes that gap.
  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = query.isFetchingNextPage;
  }, [query.isFetchingNextPage]);

  const loadMore = () => {
    if (!query.hasNextPage || isFetchingRef.current) return;
    isFetchingRef.current = true;
    void query.fetchNextPage();
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
