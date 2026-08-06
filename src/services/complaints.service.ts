import { apiRequest } from "./apiClient";

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
    const query = new URLSearchParams({ limit: "200" });
    if (params.supervisorId) query.set("supervisorId", params.supervisorId);
    if (params.status) query.set("status", params.status);
    const rows = await apiRequest<BackendComplaint[]>(`/complaints?${query.toString()}`);
    return rows.map(mapComplaint);
  },

  async create(input: { customerId: string; title: string; description: string; priority: ComplaintPriority }): Promise<ComplaintRecord> {
    const raw = await apiRequest<BackendComplaint>("/complaints", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapComplaint(raw);
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
