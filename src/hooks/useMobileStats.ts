import { useSupervisorStatDetailsQuery, useSupervisorStatsQuery } from "@/queries";

export function useSupervisorStats() {
  const query = useSupervisorStatsQuery();

  return {
    stats: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}

export function useSupervisorStatDetails(type: string | undefined) {
  const query = useSupervisorStatDetailsQuery(type);

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
  };
}
