import type { FilterableColumn } from "@/hooks/useColumnFilters";

/** A filterable grid column that also carries a fixed render width (used by hand-rolled
 * horizontally-scrolling grids, e.g. the customers list). */
export type FilterableColumnWithWidth<K extends string = string> = FilterableColumn<K> & {
  width: number;
};
