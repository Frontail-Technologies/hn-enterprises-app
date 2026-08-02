import { apiRequest } from "./apiClient";
import { resolveMediaUrl } from "./uploads.service";
import { projectsApi } from "./projects.service";
import type { EvidenceFile } from "./mockData";

export type ExpenseCategory =
  | "worker_payment"
  | "supervisor_payment"
  | "plumber_payment"
  | "rent"
  | "material_expense"
  | "other_expense";

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected";
export type ExpenseMode = "cash" | "upi" | "neft" | "bank_transfer" | "cheque" | "other";

export const expenseCategoryOptions: { label: string; value: ExpenseCategory }[] = [
  { label: "Worker Payment", value: "worker_payment" },
  { label: "Supervisor Payment", value: "supervisor_payment" },
  { label: "Plumber Payment", value: "plumber_payment" },
  { label: "Office / Guest House Rent", value: "rent" },
  { label: "Material Expense", value: "material_expense" },
  { label: "Other Expense", value: "other_expense" },
];

export type ExpenseRecord = {
  id: string;
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  siteId: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
};

export type SiteOption = { id: string; name: string };

type BackendPayment = {
  id: string;
  category: ExpenseCategory;
  paidTo: string | null;
  siteId: string | null;
  amount: string;
  paymentDate: string;
  mode: ExpenseMode;
  status: ExpenseStatus;
  purpose: string | null;
  remarks: string | null;
  evidence: Record<string, unknown>[] | null;
};

function mapEvidenceFile(item: Record<string, unknown>, index: number): EvidenceFile {
  const fileName = String(item.fileName ?? item.label ?? `evidence-${index}`);
  const fileUrl = typeof item.fileUrl === "string" ? item.fileUrl : undefined;
  return {
    id: typeof item.id === "string" && item.id ? item.id : `expense-evidence-${index}`,
    fileName,
    fileUrl,
    uri: resolveMediaUrl(fileUrl),
    status: "Uploaded",
  };
}

function mapExpense(raw: BackendPayment): ExpenseRecord {
  return {
    id: raw.id,
    category: raw.category,
    purpose: raw.purpose ?? "",
    paidTo: raw.paidTo ?? "",
    siteId: raw.siteId ?? "",
    amount: raw.amount,
    date: raw.paymentDate.slice(0, 10),
    paymentMode: raw.mode,
    status: raw.status,
    remarks: raw.remarks ?? "",
    evidence: (raw.evidence ?? []).map((item, index) => mapEvidenceFile(item, index)),
  };
}

function mapExpenseToBody(input: {
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  siteId: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
}) {
  return {
    category: input.category,
    purpose: input.purpose || undefined,
    paidTo: input.paidTo || undefined,
    siteId: input.siteId || undefined,
    amount: Number(input.amount) || 0,
    paymentDate: input.date,
    mode: input.paymentMode,
    status: input.status,
    remarks: input.remarks || undefined,
    evidence: input.evidence.length
      ? input.evidence.map((file) => ({ id: file.id, fileName: file.fileName, fileUrl: file.fileUrl }))
      : undefined,
  };
}

export const expensesApi = {
  async list(): Promise<ExpenseRecord[]> {
    const rows = await apiRequest<BackendPayment[]>("/payments?limit=200");
    return rows.map(mapExpense);
  },

  async create(input: Parameters<typeof mapExpenseToBody>[0]): Promise<ExpenseRecord> {
    const raw = await apiRequest<BackendPayment>("/payments", {
      method: "POST",
      body: JSON.stringify(mapExpenseToBody(input)),
    });
    return mapExpense(raw);
  },

  async update(id: string, input: Parameters<typeof mapExpenseToBody>[0]): Promise<ExpenseRecord> {
    const raw = await apiRequest<BackendPayment>(`/payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(mapExpenseToBody(input)),
    });
    return mapExpense(raw);
  },

  async listSiteOptions(): Promise<SiteOption[]> {
    const projects = await projectsApi.list();
    const sitesByProject = await Promise.all(
      projects.map(async (project) => {
        const sites = await projectsApi.listSites(project.id);
        return sites.map((site) => ({ id: site.id, name: `${site.name} (${project.name})` }));
      }),
    );
    return sitesByProject.flat();
  },
};
