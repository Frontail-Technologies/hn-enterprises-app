import { useCallback, useMemo, useState } from 'react';

export type FilterableColumn<K extends string = string> = {
  key: K;
  label: string;
};

// Draft-vs-committed split: everything a column's own value picker touches
// (openFilter/togglePendingValue/applyFilter/clearFilter/clearAllFilters)
// only ever writes to the *draft* - the list/query-facing `filters` returned
// below stays on whatever was last actually committed. This is what lets a
// user drill into several columns, picking values in each, without any of
// it taking effect (or hitting the network, for callers whose filters drive
// a server query) until the root sheet's own "Apply Filters" explicitly
// calls `commitFilters`. Closing the sheet without applying calls
// `discardDraft` instead, snapping the draft back to the last committed
// state so the next open starts clean rather than resurfacing an abandoned
// edit.
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

  // What the list/query actually filters by - committed only, never the
  // in-progress draft.
  const matchesFilters = useCallback(
    (row: T) =>
      columns.every((column) => {
        const values = committedFilters[column.key];
        return values?.length ? values.includes(String(row[column.key])) : true;
      }),
    [columns, committedFilters],
  );

  // The sheet's own "N selected" badges reflect the draft, so a user
  // picking values across several columns sees all of them as they go, not
  // just whichever was committed last time the sheet was opened.
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

  // Child sheet's "Done" - merges the picker's pending values into the
  // draft and returns to the column list. Never touches committedFilters.
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

  // Root sheet's "Clear all" - also draft-only, same as a single column's
  // Clear; still needs Apply Filters to actually take effect.
  const clearAllFilters = () => {
    setDraftFilters({});
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  // Root sheet's "Apply Filters" - the only place committedFilters changes.
  const commitFilters = () => {
    setCommittedFilters(draftFilters);
  };

  // Root sheet closing without applying (X, backdrop, hardware back) -
  // discards in-progress edits by resetting the draft back to whatever is
  // currently committed.
  const discardDraft = () => {
    setDraftFilters(committedFilters);
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  // Immediate full reset (both draft and committed at once) - for an
  // explicit "Reset" action that's meant to take effect right away, not
  // wait on a further Apply Filters tap.
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
