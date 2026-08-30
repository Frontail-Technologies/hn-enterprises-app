import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { customerGridColumns } from '@/constants/customers';
import { useColumnFilters } from '@/hooks/useColumnFilters';
import { useCustomerInfiniteListQuery } from '@/queries';
import type { CustomerGridRow } from '@/types/customers';
import { dedupeById } from '@/utils/dedupeById';

const SEARCH_DEBOUNCE_MS = 350;

export function useCustomersGrid() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const openingRowRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useCustomerInfiniteListQuery(
    debouncedSearch || undefined,
  );
  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  const customers = useMemo(() => dedupeById(data?.pages.flatMap((page) => page.customers) ?? []), [data]);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const rows = useMemo<CustomerGridRow[]>(
    () =>
      customers.map((customer) => ({
        id: customer.id,
        trBpNo: customer.customerConnection.trBpNo,
        customerName: customer.customerConnection.customerName,
        fullAddress: customer.customerConnection.fullAddress,
        mobileNo: customer.customerConnection.mobileNo,
        projectName: customer.projectName,
        siteArea: customer.siteArea,
        supervisorName: customer.customerConnection.supervisorName,
        status: customer.status,
        canOpen: true,
      })),
    [customers],
  );

  const {
    filters,
    draftFilters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    matchesFilters,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
    clearAllFilters,
    commitFilters,
    discardDraft,
    resetAllFilters,
    activeFilterCount,
  } = useColumnFilters(customerGridColumns, rows);

  const filteredRows = useMemo(() => rows.filter((row) => matchesFilters(row)), [matchesFilters, rows]);

  const openCustomer = (row: CustomerGridRow) => {
    if (!row.canOpen) return;

    if (openingRowRef.current === row.id) return;

    openingRowRef.current = row.id;
    router.push({
      pathname: '/customers/[id]',
      params: {
        id: row.id,
        name: row.customerName,
        trBp: row.trBpNo,
        site: row.siteArea,
      },
    });
    setTimeout(() => {
      if (openingRowRef.current === row.id) openingRowRef.current = null;
    }, 900);
  };

  const loadMore = () => {
    if (!hasNextPage || isFetchingRef.current) return;
    isFetchingRef.current = true;
    void fetchNextPage();
  };

  return {
    search,
    setSearch,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    refetch,
    total,
    rows,
    filteredRows,
    openCustomer,
    filters,
    draftFilters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
    clearAllFilters,
    commitFilters,
    discardDraft,
    resetAllFilters,
    activeFilterCount,
  };
}
