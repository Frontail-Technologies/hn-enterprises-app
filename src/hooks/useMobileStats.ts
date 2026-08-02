import { useEffect, useState } from "react";

import { statsApi, type SupervisorStat, type SupervisorStatDetailRow } from "@/services/mobileStats";

export function useSupervisorStats() {
  const [stats, setStats] = useState<SupervisorStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (mounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await statsApi.getSummary();
        if (mounted) setStats(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Unable to load stats"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return { stats, isLoading, error };
}

export function useSupervisorStatDetails(type: string | undefined) {
  const [rows, setRows] = useState<SupervisorStatDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!type) {
        if (mounted) {
          setRows([]);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await statsApi.getDetails(type);
        if (mounted) setRows(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Unable to load stat details"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [type]);

  return { rows, isLoading, error };
}
