import { useEffect, useState } from "react";

import { getRecentActivity } from "@/services/activity.service";
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
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (mounted) setIsLoading(true);

      try {
        const result = await getRecentActivity({ extra, limit, supervisorId });
        if (mounted) setItems(result);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [extra, limit, supervisorId]);

  return { items, isLoading };
}
