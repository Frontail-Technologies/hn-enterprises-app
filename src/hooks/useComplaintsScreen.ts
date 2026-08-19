import { useEffect, useRef, useState } from 'react';

import { useComplaintsInfiniteQuery } from '@/queries';
import type { ComplaintRecord } from '@/services/complaints.service';
import type { ComplaintStatusFilter } from '@/types/complaints';
import { dedupeById } from '@/utils/dedupeById';

const SEARCH_DEBOUNCE_MS = 350;

export function useComplaintsScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>('All');
  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);

  // Search now hits the server (paginated results can't be filtered
  // client-side), so debounce it instead of firing a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useComplaintsInfiniteQuery({
      search: debouncedSearch || undefined,
      status: statusFilter === 'All' ? undefined : statusFilter,
    });

  // isFetchingNextPage only flips after a render, so a burst of onScroll
  // events (nested scroll views fire these often) can call loadMore several
  // times before that catches up - this ref-based lock closes that gap.
  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Dedupe by id as a safety net - unstable sort tie-breaks on the backend
  // (or any other pagination hiccup) could otherwise hand back the same
  // complaint on two pages, which would crash the list on a duplicate key.
  const complaints = dedupeById(data?.pages.flatMap((page) => page.complaints) ?? []);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const loadMore = () => {
    if (!hasNextPage || isFetchingRef.current) return;
    isFetchingRef.current = true;
    void fetchNextPage();
  };

  return {
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    total,
    complaints,
    // Every server filter (search/status) is already applied - what's
    // loaded IS the filtered set.
    filteredComplaints: complaints,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeComplaint,
    setActiveComplaint,
    refetch,
  };
}
