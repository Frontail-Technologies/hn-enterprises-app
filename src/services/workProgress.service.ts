import { apiRequest, apiRequestPaginated, type PaginationMeta } from "./apiClient";
import type { CustomerRecord } from "../types/customers";
import type { EvidenceFile } from "../types/evidence";
import type { WorkProgressRecord, WorkProgressStatus, WorkStage } from "../types/workProgress";

type BackendWorkStage = "survey" | "workable" | "plumbing_gi" | "gc" | "commissioning" | "conversion";
type BackendWorkProgressStatus = "not_started" | "pending" | "in_progress" | "completed" | "sent_back" | "on_hold";

export type WorkProgressEvidenceFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  capturedAt?: string;
};

const STAGE_TO_MOBILE: Record<BackendWorkStage, WorkStage> = {
  survey: "Survey",
  workable: "Workable",
  plumbing_gi: "Plumbing / GI",
  gc: "GC",
  commissioning: "Commissioning",
  conversion: "Conversion",
};

const STAGE_TO_BACKEND: Record<WorkStage, BackendWorkStage> = Object.fromEntries(
  Object.entries(STAGE_TO_MOBILE).map(([backend, mobile]) => [mobile, backend]),
) as Record<WorkStage, BackendWorkStage>;

const STATUS_TO_MOBILE: Record<BackendWorkProgressStatus, WorkProgressStatus> = {
  not_started: "Not Started",
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  sent_back: "Sent Back",
  on_hold: "On Hold",
};

const STATUS_TO_BACKEND: Record<WorkProgressStatus, BackendWorkProgressStatus> = Object.fromEntries(
  Object.entries(STATUS_TO_MOBILE).map(([backend, mobile]) => [mobile, backend]),
) as Record<WorkProgressStatus, BackendWorkProgressStatus>;

export const WORK_STAGE_ORDER: WorkStage[] = [
  "Survey",
  "Workable",
  "Plumbing / GI",
  "GC",
  "Commissioning",
  "Conversion",
];

export function nextWorkStage(stage: WorkStage): WorkStage {
  const index = WORK_STAGE_ORDER.indexOf(stage);
  if (index < 0 || index === WORK_STAGE_ORDER.length - 1) return stage;
  return WORK_STAGE_ORDER[index + 1];
}

export function toWorkProgressEvidence(files: EvidenceFile[]): WorkProgressEvidenceFile[] {
  return files
    .filter((file) => Boolean(file.fileUrl))
    .map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl as string,
      mimeType: file.mimeType,
      capturedAt: file.capturedAt,
    }));
}

export function fromWorkProgressEvidence(files: WorkProgressEvidenceFile[]): EvidenceFile[] {
  return files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    uri: file.fileUrl,
    mimeType: file.mimeType,
    capturedAt: file.capturedAt,
    status: "Uploaded",
  }));
}

function daysSince(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000)));
}

type BackendWorkProgressQueueRow = {
  id: string;
  customerName: string;
  trBpNumber: string;
  mobileNumber: string | null;
  project: { id: string; name: string } | null;
  site: { id: string; name: string } | null;
  stage: BackendWorkStage;
  status: BackendWorkProgressStatus;
  nextRequiredAction: string | null;
  // Queue rows carry a count, not the evidence files themselves - see
  // work-progress.service.ts#listQueue on the backend.
  evidenceCount: number;
  lastUpdated: string | null;
  supervisor: { id: string; name: string } | null;
};

export type BackendWorkProgressUpdate = {
  id: string;
  customerId: string;
  customer: { id: string; name: string; trBpNumber: string; mobileNumber: string | null } | null;
  project: { id: string; name: string } | null;
  site: { id: string; name: string } | null;
  stage: BackendWorkStage;
  status: BackendWorkProgressStatus;
  nextRequiredAction: string | null;
  remarks: string | null;
  evidence: WorkProgressEvidenceFile[] | null;
  createdAt: string;
  supervisor: { id: string; name: string } | null;
};

export function mapWorkQueueRow(raw: BackendWorkProgressQueueRow): WorkProgressRecord {
  const currentStage = STAGE_TO_MOBILE[raw.stage] ?? "Survey";
  return {
    id: raw.id,
    customerId: raw.id,
    customerName: raw.customerName,
    mobileNumber: raw.mobileNumber ?? "",
    bpTrNumber: raw.trBpNumber,
    projectName: raw.project?.name ?? "",
    siteArea: raw.site?.name ?? "",
    supervisor: raw.supervisor?.name ?? "",
    currentStage,
    expectedNextStage: nextWorkStage(currentStage),
    nextRequiredAction: raw.nextRequiredAction ?? "",
    stageDate: raw.lastUpdated ? raw.lastUpdated.slice(0, 10) : "",
    ageDays: raw.lastUpdated ? daysSince(raw.lastUpdated) : 0,
    evidenceCount: raw.evidenceCount,
    lastUpdated: raw.lastUpdated ? raw.lastUpdated.slice(0, 10) : "",
    updatedBy: raw.supervisor?.name ?? "",
    status: STATUS_TO_MOBILE[raw.status] ?? "Not Started",
  };
}

// The customer -> buildDetailRecord input mapping was duplicated verbatim
// between the work detail and work update screens - both need the same
// handful of fields pulled out of the much larger `CustomerRecord`.
export function adaptCustomerForWorkDetail(customer: CustomerRecord) {
  return {
    id: customer.id,
    customerName: customer.customerConnection.customerName,
    mobileNumber: customer.customerConnection.mobileNo,
    bpTrNumber: customer.customerConnection.trBpNo,
    siteArea: customer.siteArea,
    supervisor: customer.customerConnection.supervisorName,
  };
}

export function isSentBack(status: WorkProgressStatus): boolean {
  return status === "Sent Back";
}

export function buildDetailRecord(
  customer: { id: string; customerName: string; mobileNumber: string; bpTrNumber: string; siteArea: string; supervisor: string },
  latest: BackendWorkProgressUpdate | undefined,
): WorkProgressRecord {
  const currentStage = latest ? (STAGE_TO_MOBILE[latest.stage] ?? "Survey") : "Survey";
  return {
    id: customer.id,
    customerId: customer.id,
    customerName: customer.customerName,
    mobileNumber: customer.mobileNumber,
    bpTrNumber: customer.bpTrNumber,
    projectName: latest?.project?.name ?? "",
    siteArea: latest?.site?.name ?? customer.siteArea,
    supervisor: latest?.supervisor?.name ?? customer.supervisor,
    currentStage,
    expectedNextStage: nextWorkStage(currentStage),
    nextRequiredAction: latest?.nextRequiredAction ?? "",
    stageDate: latest ? latest.createdAt.slice(0, 10) : "",
    ageDays: latest ? daysSince(latest.createdAt) : 0,
    evidenceCount: latest?.evidence?.length ?? 0,
    lastUpdated: latest ? latest.createdAt.slice(0, 10) : "",
    updatedBy: latest?.supervisor?.name ?? "",
    status: latest ? (STATUS_TO_MOBILE[latest.status] ?? "Not Started") : "Not Started",
  };
}

export type WorkQueueFilterParams = {
  search?: string;
  status?: WorkProgressStatus;
  projectId?: string;
  siteId?: string;
  stage?: WorkStage;
};

export function buildWorkQueueQuery(params: WorkQueueFilterParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", STATUS_TO_BACKEND[params.status]);
  if (params.projectId) query.set("projectId", params.projectId);
  if (params.siteId) query.set("siteId", params.siteId);
  if (params.stage) query.set("stage", STAGE_TO_BACKEND[params.stage]);
  return query;
}

export const workProgressApi = {
  async listQueuePage(
    params: WorkQueueFilterParams & { page: number; limit: number },
  ): Promise<{ records: WorkProgressRecord[]; pagination: PaginationMeta }> {
    const query = buildWorkQueueQuery(params);
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    const { data, pagination } = await apiRequestPaginated<BackendWorkProgressQueueRow[]>(
      `/work-progress/queue?${query.toString()}`,
    );
    const records = (data ?? []).map(mapWorkQueueRow);
    return { records, pagination: pagination ?? { page: params.page, limit: params.limit, total: records.length, totalPages: 1 } };
  },

  // Dataset-wide counts for the queue's summary tiles - same filter scope as
  // listQueuePage, computed server-side so they stay correct regardless of
  // how many pages Mobile has actually loaded.
  async queueSummary(
    params: WorkQueueFilterParams,
  ): Promise<{ inProgress: number; sentBack: number; pendingEvidence: number }> {
    const query = buildWorkQueueQuery(params);
    return apiRequest(`/work-progress/queue/summary?${query.toString()}`);
  },

  async list(params: { customerId?: string; supervisorId?: string; limit?: number } = {}): Promise<BackendWorkProgressUpdate[]> {
    const query = new URLSearchParams();
    if (params.customerId) query.set("customerId", params.customerId);
    if (params.supervisorId) query.set("supervisorId", params.supervisorId);
    if (params.limit) query.set("limit", String(params.limit));
    return apiRequest<BackendWorkProgressUpdate[]>(`/work-progress?${query.toString()}`);
  },

  async createUpdate(body: {
    customerId: string;
    stage: WorkStage;
    status: WorkProgressStatus;
    nextRequiredAction?: string;
    remarks?: string;
    evidence?: WorkProgressEvidenceFile[];
  }): Promise<BackendWorkProgressUpdate> {
    return apiRequest<BackendWorkProgressUpdate>("/work-progress", {
      method: "POST",
      body: JSON.stringify({
        customerId: body.customerId,
        stage: STAGE_TO_BACKEND[body.stage],
        status: STATUS_TO_BACKEND[body.status],
        nextRequiredAction: body.nextRequiredAction,
        remarks: body.remarks,
        evidence: body.evidence,
      }),
    });
  },
};

export { STAGE_TO_MOBILE, STATUS_TO_MOBILE };
