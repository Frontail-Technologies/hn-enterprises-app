import { apiRequest } from "./apiClient";

export type PlumberOption = {
  id: string;
  name: string;
};

export const plumbersApi = {
  async listOptions(): Promise<PlumberOption[]> {
    const response = await apiRequest<{ id: string; name: string }[]>("/plumbers?limit=1000", {
      method: "GET",
    });
    return response ?? [];
  },
};
