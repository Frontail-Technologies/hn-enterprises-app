import { useCallback, useMemo, useState } from 'react';

export type FilterableColumn<K extends string = string> = {
  key: K;
  label: string;
};

export function useColumnFilters<T extends Record<string, unknown>, K extends string>(
  columns: FilterableColumn<K>[],
  rows: T[],
) {
  const [committedFilters, setCommittedFilters] = useState<Partial<Record<K, string[]>>>({});
  const [draftFilters, setDraftFilters] = useState<Partial<Record<K, string[]>>>({});
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
        const values = committedFilters[column.key];
        return values?.length ? values.includes(String(row[column.key])) : true;
      }),
    [columns, committedFilters],
  );

  const isColumnActive = useCallback((key: K) => Boolean(draftFilters[key]?.length), [draftFilters]);

  const openFilter = (column: FilterableColumn<K>) => {
    setActiveColumn(column);
    setPendingValues(draftFilters[column.key] ?? []);
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
    setDraftFilters((current) => ({
      ...current,
      [activeColumn.key]: pendingValues,
    }));
    setFilterSearch('');
    setActiveColumn(null);
  };

  const clearFilter = () => {
    if (!activeColumn) return;
    setDraftFilters((current) => {
      const next = { ...current };
      delete next[activeColumn.key];
      return next;
    });
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  const clearAllFilters = () => {
    setDraftFilters({});
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  const commitFilters = () => {
    setCommittedFilters(draftFilters);
  };

  const discardDraft = () => {
    setDraftFilters(committedFilters);
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  const resetAllFilters = () => {
    setDraftFilters({});
    setCommittedFilters({});
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  const activeFilterCount = useMemo(
    () => Object.values(committedFilters).filter((values) => (values as string[] | undefined)?.length).length,
    [committedFilters],
  );
  const draftFilterCount = useMemo(
    () => Object.values(draftFilters).filter((values) => (values as string[] | undefined)?.length).length,
    [draftFilters],
  );

  return {
    filters: committedFilters,
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
    draftFilterCount,
  };
}
