import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useComplaintsInfiniteQuery } from '@/queries';
import type { ComplaintRecord } from '@/services/complaints.service';
import { complaintStatusFilters } from '@/constants/complaints';
import type { ComplaintStatusFilter } from '@/types/complaints';
import { dedupeById } from '@/utils/dedupeById';

const SEARCH_DEBOUNCE_MS = 350;

function initialStatusFilter(param: string | string[] | undefined): ComplaintStatusFilter {
  const value = Array.isArray(param) ? param[0] : param;
  return complaintStatusFilters.includes(value as ComplaintStatusFilter)
    ? (value as ComplaintStatusFilter)
    : 'All';
}

export function useComplaintsScreen() {
  const { status: statusParam } = useLocalSearchParams<{ status?: string }>();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>(() =>
    initialStatusFilter(statusParam),
  );
  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useComplaintsInfiniteQuery({
      search: debouncedSearch || undefined,
      status: statusFilter === 'All' ? undefined : statusFilter,
    });

  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

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
