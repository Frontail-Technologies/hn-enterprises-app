import { useQuery } from "@tanstack/react-query";

import { statsApi } from "@/services/mobileStats";
import { queryKeys } from "./keys";

export function useSupervisorStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: () => statsApi.getSummary(),
  });
}

export function useSupervisorStatDetailsQuery(type: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stats.details(type ?? ""),
    queryFn: () => statsApi.getDetails(type as string),
    enabled: Boolean(type),
  });
}
