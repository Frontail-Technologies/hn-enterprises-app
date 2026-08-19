import { useQuery } from "@tanstack/react-query";
import { plumbersApi } from "@/services/plumbers.service";
import { queryKeys } from "./keys";

export function usePlumbersOptionsQuery() {
  return useQuery({
    queryKey: queryKeys.plumbers.options,
    queryFn: () => plumbersApi.listOptions(),
  });
}
