import { useQuery } from "@tanstack/react-query";

import { getRecentActivity } from "@/services/activity.service";
import type { ActivityLogEntry } from "@/services/mockData";
import { queryKeys } from "./keys";

export function useRecentActivityQuery({
  extra = [],
  limit = 10,
  supervisorId,
}: {
  extra?: ActivityLogEntry[];
  limit?: number;
  supervisorId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.activity.recent({
      supervisorId,
      limit,
      extraIds: extra.map((item) => item.id),
    }),
    queryFn: () => getRecentActivity({ extra, limit, supervisorId }),
  });
}
