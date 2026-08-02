import { useEffect, useState } from "react";

import { workProgressApi, type BackendWorkProgressUpdate } from "@/services/workProgress.service";
import type { WorkProgressRecord } from "@/services/mockData";

export function useWorkQueue() {
  const [items, setItems] = useState<WorkProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await workProgressApi.listQueue();
      setItems(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to load work queue"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (mounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await workProgressApi.listQueue();
        if (mounted) setItems(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Unable to load work queue"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  return { items, isLoading, error, refetch: load };
}

export function useWorkProgressHistory(customerId: string | undefined) {
  const [history, setHistory] = useState<BackendWorkProgressUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    if (!customerId) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await workProgressApi.list({ customerId });
      setHistory(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to load work progress history"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!customerId) {
        if (mounted) {
          setHistory([]);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await workProgressApi.list({ customerId });
        if (mounted) setHistory(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Unable to load work progress history"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  return { history, isLoading, error, refetch: load };
}
