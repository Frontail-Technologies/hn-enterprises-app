import { apiRequest, apiRequestPaginated, type PaginationMeta } from "./apiClient";

export type ComplaintPriority = "low" | "medium" | "high";
export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";

export type ComplaintRecord = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  supervisorRemark: string;
  createdAt: string;
};

type BackendComplaint = {
  id: string;
  customerId: string;
  customer: { id: string; name: string } | null;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  supervisorRemark: string | null;
  createdAt: string;
};

export function isOpenComplaint(complaint: ComplaintRecord) {
  return complaint.status === "open" || complaint.status === "in_progress";
}

export type ComplaintListParams = {
  search?: string;
  status?: ComplaintStatus;
  supervisorId?: string;
};

export function buildComplaintsQuery(params: ComplaintListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.supervisorId) query.set("supervisorId", params.supervisorId);
  return query;
}

function mapComplaint(raw: BackendComplaint): ComplaintRecord {
  return {
    id: raw.id,
    customerId: raw.customerId,
    customerName: raw.customer?.name ?? "",
    title: raw.title,
    description: raw.description,
    priority: raw.priority,
    status: raw.status,
    supervisorRemark: raw.supervisorRemark ?? "",
    createdAt: raw.createdAt,
  };
}

export const complaintsApi = {
  async list(params: { supervisorId?: string; status?: ComplaintStatus } = {}): Promise<ComplaintRecord[]> {
    const query = new URLSearchParams({ limit: "100" });
    if (params.supervisorId) query.set("supervisorId", params.supervisorId);
    if (params.status) query.set("status", params.status);
    const rows = await apiRequest<BackendComplaint[]>(`/complaints?${query.toString()}`);
    return rows.map(mapComplaint);
  },

  async listPage(
    params: ComplaintListParams & { page: number; limit: number },
  ): Promise<{ complaints: ComplaintRecord[]; pagination: PaginationMeta }> {
    const query = buildComplaintsQuery(params);
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    const { data, pagination } = await apiRequestPaginated<BackendComplaint[]>(`/complaints?${query.toString()}`);
    const complaints = (data ?? []).map(mapComplaint);
    return {
      complaints,
      pagination: pagination ?? { page: params.page, limit: params.limit, total: complaints.length, totalPages: 1 },
    };
  },

  async create(input: { customerId: string; title: string; description: string; priority: ComplaintPriority }): Promise<ComplaintRecord> {
    const raw = await apiRequest<BackendComplaint>("/complaints", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapComplaint(raw);
  },

  async statusCounts(params: { supervisorId?: string } = {}): Promise<Record<ComplaintStatus, number>> {
    const query = new URLSearchParams();
    if (params.supervisorId) query.set("supervisorId", params.supervisorId);
    return apiRequest<Record<ComplaintStatus, number>>(`/complaints/status-counts?${query.toString()}`);
  },

  async updateStatus(id: string, input: { status: ComplaintStatus; supervisorRemark?: string }): Promise<ComplaintRecord> {
    const raw = await apiRequest<BackendComplaint>(`/complaints/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        supervisorRemark: input.supervisorRemark || undefined,
      }),
    });
    return mapComplaint(raw);
  },
};
