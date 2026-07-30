import { useEffect, useState } from "react";

import { customersService } from "@/services/customers.service";
import type { CustomerRecord } from "@/services/mockData";

export function useCustomerRecord(id: string | undefined) {
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    if (!id) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await customersService.get(id);
      setCustomer(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to load customer"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!id) {
        if (mounted) {
          setCustomer(null);
          setIsLoading(false);
        }
        return;
      }

      if (mounted) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await customersService.get(id);
        if (mounted) setCustomer(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Unable to load customer"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [id]);

  return { customer, isLoading, error, refetch: load };
}

export function useCustomerList(search?: string) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await customersService.list(search);
      setCustomers(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unable to load customers"));
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
        const result = await customersService.list(search);
        if (mounted) setCustomers(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err : new Error("Unable to load customers"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [search]);

  return { customers, isLoading, error, refetch: load };
}
