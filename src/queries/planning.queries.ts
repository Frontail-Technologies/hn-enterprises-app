import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  planningApi,
  type BackendDprRecord,
  type BackendSitePlan,
  type DprStatus,
  type DprTaskPayload,
  type PlanningEvidenceFile,
  type PlanTaskPayload,
} from "@/services/planning.service";
import { queryKeys } from "./keys";

type PlanningParams = {
  projectId?: string;
  siteId?: string;
  supervisorId?: string;
  date?: string;
};

export function useSitePlansQuery(params: PlanningParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.planning.sitePlans(params),
    queryFn: () => planningApi.listSitePlans(params),
    enabled: options.enabled ?? true,
  });
}

export function useDprRecordsQuery(params: PlanningParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.planning.dprRecords(params),
    queryFn: () => planningApi.listDprRecords(params),
    enabled: options.enabled ?? true,
  });
}

export function useUpsertSitePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { projectId: string; siteId: string; date: string; tasks: PlanTaskPayload[] }) =>
      planningApi.upsertSitePlan(body),
    onSuccess: (record: BackendSitePlan) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.sites(record.projectId) });
    },
  });
}

export function useUpsertDprRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      projectId: string;
      siteId: string;
      date: string;
      status?: DprStatus;
      remarks?: string;
      tasks: DprTaskPayload[];
      evidence?: PlanningEvidenceFile[];
    }) => planningApi.upsertDprRecord(body),
    onSuccess: (record: BackendDprRecord) => {
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.sites(record.projectId) });
    },
  });
}
