import { useCallback } from "react";

import { useCustomerListQuery, useCustomerQuery } from "@/queries";

export function useCustomerRecord(id: string | undefined) {
  const query = useCustomerQuery(id);
  // Depend on query.refetch specifically (stable across renders in TanStack
  // Query), not the whole query object (a fresh reference every render) -
  // otherwise this wrapper - and every prop/effect downstream that takes it
  // as a dependency - would recompute on every render for no reason.
  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    customer: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch,
  };
}

export function useCustomerList(search?: string) {
  const query = useCustomerListQuery(search);
  // Same reasoning as useCustomerRecord above: query.refetch is stable, the
  // query object isn't.
  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refetch,
  };
}
