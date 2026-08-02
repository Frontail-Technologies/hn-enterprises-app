import { apiRequest } from "./apiClient";

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
  | "planning";

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

  async getDetails(type: string): Promise<SupervisorStatDetailRow[]> {
    return apiRequest<SupervisorStatDetailRow[]>(`/stats/${type}/details`);
  },
};
