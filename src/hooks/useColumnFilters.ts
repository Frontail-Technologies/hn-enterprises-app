import { useCallback, useMemo, useState } from 'react';

export type FilterableColumn<K extends string = string> = {
  key: K;
  label: string;
};

export function useColumnFilters<T extends Record<string, unknown>, K extends string>(
  columns: FilterableColumn<K>[],
  rows: T[],
) {
  const [filters, setFilters] = useState<Partial<Record<K, string[]>>>({});
  const [activeColumn, setActiveColumn] = useState<FilterableColumn<K> | null>(null);
  const [pendingValues, setPendingValues] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');

  const activeValues = useMemo(() => {
    if (!activeColumn) return [];
    const query = filterSearch.trim().toLowerCase();
    return Array.from(new Set(rows.map((row) => String(row[activeColumn.key]))))
      .filter(Boolean)
      .filter((value) => (query ? value.toLowerCase().includes(query) : true));
  }, [activeColumn, filterSearch, rows]);

  const matchesFilters = useCallback(
    (row: T) =>
      columns.every((column) => {
        const values = filters[column.key];
        return values?.length ? values.includes(String(row[column.key])) : true;
      }),
    [columns, filters],
  );

  const isColumnActive = useCallback((key: K) => Boolean(filters[key]?.length), [filters]);

  const openFilter = (column: FilterableColumn<K>) => {
    setActiveColumn(column);
    setPendingValues(filters[column.key] ?? []);
    setFilterSearch('');
  };

  const closeFilter = () => setActiveColumn(null);

  const togglePendingValue = (value: string) => {
    setPendingValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const applyFilter = () => {
    if (!activeColumn) return;
    setFilters((current) => ({
      ...current,
      [activeColumn.key]: pendingValues,
    }));
    setFilterSearch('');
    setActiveColumn(null);
  };

  const clearFilter = () => {
    if (!activeColumn) return;
    setFilters((current) => {
      const next = { ...current };
      delete next[activeColumn.key];
      return next;
    });
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  return {
    filters,
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
  };
}
