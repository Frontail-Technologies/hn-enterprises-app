import { apiRequest } from "./apiClient";

export type ProjectOption = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
};

export type ProjectSiteOption = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
};

export const projectsApi = {
  async list(): Promise<ProjectOption[]> {
    return apiRequest<ProjectOption[]>("/projects?limit=200");
  },

  async listSites(projectId: string): Promise<ProjectSiteOption[]> {
    return apiRequest<ProjectSiteOption[]>(`/projects/${projectId}/sites`);
  },
};
