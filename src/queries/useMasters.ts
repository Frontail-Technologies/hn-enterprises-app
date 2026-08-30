import { useQuery } from "@tanstack/react-query";
import { fetchCustomFieldDefinitions, fetchMasterValues } from "../services/masters.service";
import { queryKeys } from "./keys";

export function useMasterValuesQuery(category: string) {
  return useQuery({
    queryKey: queryKeys.masters.values(category),
    queryFn: () => fetchMasterValues(category),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.map((item) => item.value),
  });
}

export function useCustomFieldDefinitionsQuery() {
  return useQuery({
    queryKey: queryKeys.masters.customFields,
    queryFn: () => fetchCustomFieldDefinitions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
