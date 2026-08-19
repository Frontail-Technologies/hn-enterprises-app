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
  customerId?: string;
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

// Site-wise aggregates for the overview - see planning.service.ts's
// getWorkPlanningOverview/getDprOverview. Both mutations below already
// invalidate the broad ["planning"] key on save, which covers these too since
// they're nested under it - no extra invalidation wiring needed.
export function useWorkPlanningOverviewQuery(date: string) {
  return useQuery({
    queryKey: queryKeys.planning.workOverview(date),
    queryFn: () => planningApi.getWorkPlanningOverview(date),
  });
}

export function useDprOverviewQuery(date: string) {
  return useQuery({
    queryKey: queryKeys.planning.dprOverview(date),
    queryFn: () => planningApi.getDprOverview(date),
  });
}

export function useSiteCustomersQuery(siteId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.planning.siteCustomers(siteId),
    queryFn: () => planningApi.listSiteCustomers(siteId),
    enabled: options.enabled ?? Boolean(siteId),
  });
}

// Extracted so the invalidation set itself is directly testable (this repo's
// test setup has no React renderer - see workPlanningDraft.test.ts) without
// needing to render the mutation hook.
export function sitePlanInvalidationKeys(record: BackendSitePlan) {
  return [
    queryKeys.planning.all,
    queryKeys.activity.all,
    // Backend stats.service.ts's Planning stat reads the sitePlans table
    // directly - without this, a successful plan change leaves that stat
    // stale until something else happens to invalidate it. Mirrors the DPR
    // mutation below, which already does this.
    queryKeys.stats.all,
    queryKeys.projects.sites(record.projectId),
  ];
}

export function useUpsertSitePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { customerId: string; projectId: string; siteId: string; date: string; tasks: PlanTaskPayload[] }) =>
      planningApi.upsertSitePlan(body),
    onSuccess: (record: BackendSitePlan) => {
      sitePlanInvalidationKeys(record).forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
}

export function useUpsertDprRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: {
      customerId: string;
      projectId: string;
      siteId: string;
      date: string;
      status?: DprStatus;
      remarks?: string;
      tasks: DprTaskPayload[];
      evidence?: PlanningEvidenceFile[];
    }) => planningApi.upsertDprRecord(body),
    onSuccess: (record: BackendDprRecord) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planning.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.sites(record.projectId) });
    },
  });
}
