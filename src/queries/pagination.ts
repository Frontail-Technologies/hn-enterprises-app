import type { PaginationMeta } from "@/services/apiClient";

export function nextPageParam(pagination: PaginationMeta): number | undefined {
  return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
}
