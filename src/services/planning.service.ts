import { apiRequest } from "./apiClient";

export type PlanningTaskId =
  | "survey"
  | "gi"
  | "gc"
  | "laying"
  | "valve"
  | "pre"
  | "conversion"
  | "jmr"
  | "testing"
  | "route"
  | "commissioning";

export type DprStatus = "draft" | "submitted" | "approved";

export type PlanTaskPayload = {
  id: PlanningTaskId;
  qty?: string;
  worker?: string;
};

export type DprTaskPayload = {
  id: PlanningTaskId;
  plannedQty?: string;
  completedQty?: string;
  worker?: string;
  delayReason?: string;
};

export type PlanningEvidenceFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  capturedAt?: string;
};

export type BackendSitePlan = {
  id: string;
  customerId: string;
  projectId: string;
  siteId: string;
  date: string;
  supervisorId: string;
  tasks: PlanTaskPayload[];
  supervisor: { id: string; name: string } | null;
  site: { id: string; name: string; address: string | null } | null;
  project: { id: string; name: string } | null;
  customer: { id: string; name: string; trBpNumber: string } | null;
};

export type PlanningOverviewStatus = "pending" | "partial" | "done";

// One row per Site for the mobile overview - an aggregate over the same
// customer-wise records the editors read/write, never a separate source of
// truth. See backend planning.service.ts's getWorkPlanningOverview/getDprOverview.
export type SiteOverviewRow = {
  siteId: string;
  siteName: string;
  projectId: string;
  projectName: string;
  totalCustomers: number;
  completedCustomers: number;
  status: PlanningOverviewStatus;
};

export type SiteCustomerRow = {
  id: string;
  trBpNumber: string;
  customerName: string;
  projectId: string;
  siteId: string;
};

export type BackendDprRecord = {
  id: string;
  customerId: string;
  projectId: string;
  siteId: string;
  date: string;
  supervisorId: string;
  status: DprStatus;
  remarks: string | null;
  tasks: DprTaskPayload[];
  evidence: PlanningEvidenceFile[] | null;
  submittedAt: string | null;
  supervisor: { id: string; name: string } | null;
  site: { id: string; name: string; address: string | null } | null;
  project: { id: string; name: string } | null;
  customer: { id: string; name: string; trBpNumber: string } | null;
};

export const planningApi = {
  async listSitePlans(params: {
    siteId?: string;
    date?: string;
    supervisorId?: string;
    projectId?: string;
    customerId?: string;
  }): Promise<BackendSitePlan[]> {
    const query = new URLSearchParams();
    if (params.projectId) query.set("projectId", params.projectId);
    if (params.siteId) query.set("siteId", params.siteId);
    if (params.date) query.set("date", params.date);
    if (params.supervisorId) query.set("supervisorId", params.supervisorId);
    if (params.customerId) query.set("customerId", params.customerId);
    return apiRequest<BackendSitePlan[]>(`/planning/site-plans?${query.toString()}`);
  },

  async upsertSitePlan(body: {
    customerId: string;
    projectId: string;
    siteId: string;
    date: string;
    tasks: PlanTaskPayload[];
  }): Promise<BackendSitePlan> {
    return apiRequest<BackendSitePlan>("/planning/site-plans", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  async listDprRecords(params: {
    siteId?: string;
    date?: string;
    supervisorId?: string;
    projectId?: string;
    customerId?: string;
  }): Promise<BackendDprRecord[]> {
    const query = new URLSearchParams();
    if (params.projectId) query.set("projectId", params.projectId);
    if (params.siteId) query.set("siteId", params.siteId);
    if (params.date) query.set("date", params.date);
    if (params.supervisorId) query.set("supervisorId", params.supervisorId);
    if (params.customerId) query.set("customerId", params.customerId);
    return apiRequest<BackendDprRecord[]>(`/planning/dpr-records?${query.toString()}`);
  },

  async upsertDprRecord(body: {
    customerId: string;
    projectId: string;
    siteId: string;
    date: string;
    status?: DprStatus;
    remarks?: string;
    tasks: DprTaskPayload[];
    evidence?: PlanningEvidenceFile[];
  }): Promise<BackendDprRecord> {
    return apiRequest<BackendDprRecord>("/planning/dpr-records", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  async getWorkPlanningOverview(date: string): Promise<SiteOverviewRow[]> {
    return apiRequest<SiteOverviewRow[]>(`/planning/site-plans/overview?date=${encodeURIComponent(date)}`);
  },

  async getDprOverview(date: string): Promise<SiteOverviewRow[]> {
    return apiRequest<SiteOverviewRow[]>(`/planning/dpr-records/overview?date=${encodeURIComponent(date)}`);
  },

  async listSiteCustomers(siteId: string): Promise<SiteCustomerRow[]> {
    return apiRequest<SiteCustomerRow[]>(`/planning/site-customers?siteId=${encodeURIComponent(siteId)}`);
  },
};
