import type { FilterableColumn } from "@/hooks/useColumnFilters";

export type FilterableColumnWithWidth<K extends string = string> = FilterableColumn<K> & {
  width: number;
};
