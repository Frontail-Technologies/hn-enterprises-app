import { apiRequest, apiRequestPaginated, type PaginationMeta } from "./apiClient";

export type SupervisorStatTone = "blue" | "orange" | "green" | "red";

export type SupervisorStatId =
  | "survey-done"
  | "conversion-done"
  | "gi-done"
  | "jmr-done"
  | "gc-done"
  | "site-expenses-done"
  | "laying"
  | "flushing-testing"
  | "valve-chamber"
  | "pre-commissioning"
  | "commissioning"
  | "dpr"
  | "planning"
  | "pole-marker"
  | "route-marker"
  | "complaint-customer"
  | "total-pbg-assignment"
  | "total-connection-done"
  | "total-connection-remark"
  | "total-conversion-done"
  | "customer-resolve";

export type SupervisorStat = {
  id: SupervisorStatId;
  label: string;
  value: string;
  suffix: string;
  tone: SupervisorStatTone;
};

export type SupervisorStatDetailRow = {
  id: string;
  customerId?: string;
  title: string;
  reference: string;
  site: string;
  status:
    | "Done"
    | "Pending"
    | "In Progress"
    | "Sent Back"
    | "Not Required"
    | "Not Started"
    | "On Hold"
    | "Planned"
    | "Delayed";
  updatedOn: string;
  helper: string;
};

export const statsApi = {
  async getSummary(): Promise<SupervisorStat[]> {
    return apiRequest<SupervisorStat[]>("/stats/summary");
  },

  async getDetailsPage(
    type: string,
    params: { page: number; limit: number },
  ): Promise<{ rows: SupervisorStatDetailRow[]; pagination: PaginationMeta }> {
    const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) });
    const { data, pagination } = await apiRequestPaginated<SupervisorStatDetailRow[]>(
      `/stats/${type}/details?${query.toString()}`,
    );
    const rows = data ?? [];
    return { rows, pagination: pagination ?? { page: params.page, limit: params.limit, total: rows.length, totalPages: 1 } };
  },
};
