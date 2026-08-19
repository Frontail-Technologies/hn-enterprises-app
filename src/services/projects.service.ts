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

export type AllSiteOption = {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
};

export const projectsApi = {
  async list(): Promise<ProjectOption[]> {
    return apiRequest<ProjectOption[]>("/projects?limit=200");
  },

  async listSites(projectId: string): Promise<ProjectSiteOption[]> {
    return apiRequest<ProjectSiteOption[]>(`/projects/${projectId}/sites`);
  },

  // Flat, cross-project - backs the Work Queue's Site filter, which needs
  // every site's stable id up front rather than one project at a time.
  async listAllSites(): Promise<AllSiteOption[]> {
    return apiRequest<AllSiteOption[]>("/projects/sites");
  },
};
