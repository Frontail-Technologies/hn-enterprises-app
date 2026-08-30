import { useCallback } from "react";

import { useCustomerListQuery, useCustomerQuery } from "@/queries";

export function useCustomerRecord(id: string | undefined) {
  const query = useCustomerQuery(id);
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
