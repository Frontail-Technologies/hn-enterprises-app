import { apiRequest, apiRequestFormData, apiRequestPaginated, type PaginationMeta } from "./apiClient";
import { resolveMediaUrl, toFormDataFilePart } from "./uploads.service";
import type { EvidenceFile } from "../types/evidence";
import type { ExpenseColumnKey } from "../types/expenses";

export type ExpenseListParams = {
  search?: string;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  columnFilters?: Partial<Record<ExpenseColumnKey, string[]>>;
};

export type ExpenseSummary = {
  count: number;
  total: number;
  categoryBreakdown: { category: ExpenseCategory; count: number; total: number }[];
  recent: ExpenseRecord[];
};

export function buildExpenseListQuery(params: ExpenseListParams) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const columnFilters = params.columnFilters ?? {};
  for (const key of Object.keys(columnFilters) as ExpenseColumnKey[]) {
    const values = columnFilters[key];
    if (values?.length) query.set(key, values.join(","));
  }
  return query;
}

export type ExpenseCategory =
  | "worker_payment"
  | "supervisor_payment"
  | "plumber_payment"
  | "rent"
  | "material_expense"
  | "other_expense";

export type ExpenseStatus = "draft" | "submitted" | "approved" | "rejected";
export type ExpenseMode = string;

export const expenseCategoryOptions: { label: string; value: ExpenseCategory }[] = [
  { label: "Worker Payments", value: "worker_payment" },
  { label: "Supervisor Payments", value: "supervisor_payment" },
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
  customerName: string;
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
  customerName?: string | null;
  siteId: string | null;
  address: string | null;
  amount: string;
  paymentDate: string;
  mode: ExpenseMode;
  status: ExpenseStatus;
  purpose: string | null;
  remarks: string | null;
  evidence?: Record<string, unknown>[] | null;
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
    customerName: raw.customerName ?? "",
    siteId: raw.siteId ?? "",
    address: raw.address ?? "",
    amount: raw.amount,
    date: (raw.paymentDate ?? "").slice(0, 10),
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

  const alreadyUploaded = input.evidence.filter((file) => file.fileUrl);
  formData.append(
    "evidence",
    JSON.stringify(alreadyUploaded.map((file) => ({ id: file.id, fileName: file.fileName, fileUrl: file.fileUrl }))),
  );

  input.evidence
    .filter((file) => !file.fileUrl && file.uri)
    .forEach((file) => {
      formData.append("files", toFormDataFilePart({ uri: file.uri!, fileName: file.fileName, mimeType: file.mimeType }));
    });

  return formData;
}

export const expensesApi = {
  async list(): Promise<ExpenseRecord[]> {
    const rows = await apiRequest<BackendPayment[]>("/payments?limit=100");
    return rows.map(mapExpense);
  },

  async listPage(params: ExpenseListParams & { page: number; limit: number }): Promise<{
    expenses: ExpenseRecord[];
    pagination: PaginationMeta;
  }> {
    const query = buildExpenseListQuery(params);
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    const { data, pagination } = await apiRequestPaginated<BackendPayment[]>(`/payments?${query.toString()}`);
    const expenses = (data ?? []).map(mapExpense);
    return { expenses, pagination: pagination ?? { page: params.page, limit: params.limit, total: expenses.length, totalPages: 1 } };
  },

  async summary(params: ExpenseListParams, options: { totalsOnly?: boolean } = {}): Promise<ExpenseSummary> {
    const query = buildExpenseListQuery(params);
    if (options.totalsOnly) query.set("totalsOnly", "true");
    const raw = await apiRequest<Omit<ExpenseSummary, "recent"> & { recent: BackendPayment[] }>(
      `/payments/summary?${query.toString()}`,
    );
    return { ...raw, recent: raw.recent.map(mapExpense) };
  },

  async fetchFilterValues(column: ExpenseColumnKey | "category"): Promise<string[]> {
    return apiRequest<string[]>(`/payments/filter-values?column=${encodeURIComponent(column)}`);
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
