import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';

import { customerGridColumns } from '@/constants/customers';
import { useColumnFilters } from '@/hooks/useColumnFilters';
import { useCustomerList } from '@/hooks/useCustomerRecord';
import type { CustomerGridRow } from '@/types/customers';

export function useCustomersGrid() {
  const [search, setSearch] = useState('');
  const openingRowRef = useRef<string | null>(null);
  const { customers, isLoading } = useCustomerList();

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
        status: customer.status,
        canOpen: true,
      })),
    [customers],
  );

  const {
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
  } = useColumnFilters(customerGridColumns, rows);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = query
        ? customerGridColumns.some((column) => String(row[column.key]).toLowerCase().includes(query))
        : true;

      return matchesSearch && matchesFilters(row);
    });
  }, [matchesFilters, rows, search]);

  const openCustomer = (row: CustomerGridRow) => {
    if (!row.canOpen) return;

    if (openingRowRef.current === row.id) return;

    openingRowRef.current = row.id;
    router.push({
      pathname: '/customers/[id]',
      params: { id: row.id },
    });
    setTimeout(() => {
      if (openingRowRef.current === row.id) openingRowRef.current = null;
    }, 900);
  };

  return {
    search,
    setSearch,
    isLoading,
    rows,
    filteredRows,
    openCustomer,
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
  };
}
