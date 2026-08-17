import { apiRequest, apiRequestFormData } from "./apiClient";
import { resolveMediaUrl } from "./uploads.service";
import type { EvidenceFile } from "./mockData";

export type ExpenseCategory =
  | "worker_payment"
  | "plumber_payment"
  | "rent"
  | "material_expense"
  | "other_expense";

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected";
export type ExpenseMode = string;

export const expenseCategoryOptions: { label: string; value: ExpenseCategory }[] = [
  { label: "Worker Payments", value: "worker_payment" },
  { label: "Plumber Payments", value: "plumber_payment" },
  { label: "Office / Guest House Rent", value: "rent" },
  { label: "Material Expenses", value: "material_expense" },
  { label: "Other Expenses", value: "other_expense" },
];

export type ExpenseRecord = {
  id: string;
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  plumberId: string;
  customerId: string;
  siteId: string;
  address: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
};

type BackendPayment = {
  id: string;
  category: ExpenseCategory;
  paidTo: string | null;
  plumberId: string | null;
  customerId: string | null;
  siteId: string | null;
  address: string | null;
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
    plumberId: raw.plumberId ?? "",
    customerId: raw.customerId ?? "",
    siteId: raw.siteId ?? "",
    address: raw.address ?? "",
    amount: raw.amount,
    date: raw.paymentDate.slice(0, 10),
    paymentMode: raw.mode,
    status: raw.status,
    remarks: raw.remarks ?? "",
    evidence: (raw.evidence ?? []).map((item, index) => mapEvidenceFile(item, index)),
  };
}

type ExpenseInput = {
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  plumberId: string;
  customerId: string;
  siteId: string;
  address: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
};

// Attachments are embedded directly in this multipart request instead of
// uploaded separately beforehand - a photo the user picks but never actually
// saves (e.g. backs out of the form) never reaches storage at all.
function buildExpenseFormData(input: ExpenseInput) {
  const formData = new FormData();
  formData.append("category", input.category);
  if (input.purpose) formData.append("purpose", input.purpose);
  if (input.paidTo) formData.append("paidTo", input.paidTo);
  if (input.plumberId) formData.append("plumberId", input.plumberId);
  if (input.customerId) formData.append("customerId", input.customerId);
  if (input.siteId) formData.append("siteId", input.siteId);
  if (input.address) formData.append("address", input.address);
  formData.append("amount", input.amount);
  formData.append("paymentDate", input.date);
  formData.append("mode", input.paymentMode);
  formData.append("status", input.status);
  if (input.remarks) formData.append("remarks", input.remarks);

  // Always append evidence, even when empty - omitting the field entirely
  // (vs. sending an empty array) reads as "leave it alone" on the backend,
  // which would silently un-delete any photos the user just removed.
  const alreadyUploaded = input.evidence.filter((file) => file.fileUrl);
  formData.append(
    "evidence",
    JSON.stringify(alreadyUploaded.map((file) => ({ id: file.id, fileName: file.fileName, fileUrl: file.fileUrl }))),
  );

  input.evidence
    .filter((file) => !file.fileUrl && file.uri)
    .forEach((file) => {
      formData.append("files", {
        uri: file.uri!,
        name: file.fileName,
        type: file.mimeType || "application/octet-stream",
      } as unknown as Blob);
    });

  return formData;
}

export const expensesApi = {
  async list(): Promise<ExpenseRecord[]> {
    const rows = await apiRequest<BackendPayment[]>("/payments?limit=200");
    return rows.map(mapExpense);
  },

  async get(id: string): Promise<ExpenseRecord> {
    const raw = await apiRequest<BackendPayment>(`/payments/${id}`);
    return mapExpense(raw);
  },

  async create(input: ExpenseInput): Promise<ExpenseRecord> {
    const raw = await apiRequestFormData<BackendPayment>("/payments", buildExpenseFormData(input), {
      method: "POST",
      timeoutMs: 60000,
    });
    return mapExpense(raw);
  },

  async update(id: string, input: ExpenseInput): Promise<ExpenseRecord> {
    const raw = await apiRequestFormData<BackendPayment>(`/payments/${id}`, buildExpenseFormData(input), {
      method: "PATCH",
      timeoutMs: 60000,
    });
    return mapExpense(raw);
  },
};
