import { useQuery } from "@tanstack/react-query";

import { projectsApi } from "@/services/projects.service";
import { queryKeys } from "./keys";

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectsApi.list(),
  });
}

export function useProjectSitesQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.sites(projectId ?? ""),
    queryFn: () => projectsApi.listSites(projectId as string),
    enabled: Boolean(projectId),
  });
}
