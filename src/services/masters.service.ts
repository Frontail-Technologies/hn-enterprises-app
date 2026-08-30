import { apiRequest } from "./apiClient";

export type MasterValue = {
  id: string;
  category: string;
  value: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
};

const CATEGORY_TO_BACKEND: Record<string, string> = {
  "Payment Types": "payment_types",
  "Connection Types": "connection_types",
  "House Types": "house_types",
  Schemes: "schemes",
  "Document Categories": "document_categories",
  "Material Categories": "material_categories",
  "Meter Types": "meter_types",
};

export async function fetchMasterValues(category: string): Promise<MasterValue[]> {
  const backendCategory = CATEGORY_TO_BACKEND[category] ?? category;
  const data = await apiRequest<MasterValue[]>(`/masters/values?category=${encodeURIComponent(backendCategory)}`);
  return data;
}

export type CustomFieldValueType = "text" | "number" | "date" | "amount" | "yes_no" | "dropdown";
export type CustomFieldAccess = "admin_only" | "supervisor_view" | "supervisor_edit";

export type CustomFieldDefinition = {
  id: string;
  key: string;
  label: string;
  groupName: string;
  valueType: CustomFieldValueType;
  dropdownOptions: string[];
  required: boolean;
  sortOrder: number;
  supervisorAccess: CustomFieldAccess;
  status: "active" | "inactive";
};

export async function fetchCustomFieldDefinitions(): Promise<CustomFieldDefinition[]> {
  const data = await apiRequest<CustomFieldDefinition[]>("/masters/custom-fields?status=active");
  return data;
}
