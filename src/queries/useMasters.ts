import { useQuery } from "@tanstack/react-query";
import { fetchCustomFieldDefinitions, fetchMasterValues } from "../services/masters.service";

export function useMasterValuesQuery(category: string) {
  return useQuery({
    queryKey: ["masters", "values", category],
    queryFn: () => fetchMasterValues(category),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => data.map((item) => item.value),
  });
}

export function useCustomFieldDefinitionsQuery() {
  return useQuery({
    queryKey: ["masters", "custom-fields", "active"],
    queryFn: () => fetchCustomFieldDefinitions(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
