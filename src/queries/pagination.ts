import type { PaginationMeta } from "@/services/apiClient";

// Shared by every infinite query's `getNextPageParam` (Customers, Work
// Queue, Expenses) - the backend's page/limit/total/totalPages shape is the
// one canonical pagination contract, so there's exactly one place this math
// happens instead of three copies drifting apart.
export function nextPageParam(pagination: PaginationMeta): number | undefined {
  return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
}
