import { useRecentActivityQuery } from "@/queries";
import type { ActivityLogEntry } from "@/services/mockData";

export function useRecentActivity({
  extra = [],
  limit = 10,
  supervisorId,
}: {
  extra?: ActivityLogEntry[];
  limit?: number;
  supervisorId?: string;
}) {
  const query = useRecentActivityQuery({ extra, limit, supervisorId });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
  };
}
