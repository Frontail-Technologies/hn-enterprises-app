import { useEffect, useRef, useState } from "react";

import { useAllProjectSitesQuery, useProjectsQuery, useWorkQueueInfiniteQuery, useWorkQueueSummaryQuery } from "@/queries";
import { WORK_STAGE_ORDER } from "@/services/workProgress.service";
import type { WorkQueueFilter, WorkStage } from "@/types/workProgress";
import { dedupeById } from "@/utils/dedupeById";

const SEARCH_DEBOUNCE_MS = 350;
const ALL = "All" as const;

export function useWorkQueueFilters() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkQueueFilter>(ALL);
  const [projectFilter, setProjectFilter] = useState<string>(ALL);
  const [siteFilter, setSiteFilter] = useState<string>(ALL);
  const [stageFilter, setStageFilter] = useState<WorkStage | typeof ALL>(ALL);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const projectsQuery = useProjectsQuery();
  const allSitesQuery = useAllProjectSitesQuery();

  const projectOptions = [
    { value: ALL, label: ALL },
    ...(projectsQuery.data ?? []).map((project) => ({ value: project.id, label: project.name })),
  ];
  const siteOptions = [
    { value: ALL, label: ALL },
    ...(allSitesQuery.data ?? []).map((site) => ({ value: site.id, label: site.name })),
  ];
  const stageOptions = [ALL, ...WORK_STAGE_ORDER].map((stage) => ({ value: stage, label: stage }));

  const filterParams = {
    search: debouncedSearch || undefined,
    status: statusFilter === ALL ? undefined : statusFilter,
    projectId: projectFilter === ALL ? undefined : projectFilter,
    siteId: siteFilter === ALL ? undefined : siteFilter,
    stage: stageFilter === ALL ? undefined : stageFilter,
  };

  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useWorkQueueInfiniteQuery(filterParams);
  const summaryQuery = useWorkQueueSummaryQuery(filterParams);

  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  const records = dedupeById(data?.pages.flatMap((page) => page.records) ?? []);
  const total = data?.pages[0]?.pagination.total ?? 0;

  const loadMore = () => {
    if (!hasNextPage || isFetchingRef.current) return;
    isFetchingRef.current = true;
    void fetchNextPage();
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    siteFilter,
    setSiteFilter,
    stageFilter,
    setStageFilter,
    projectOptions,
    siteOptions,
    stageOptions,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    refetch,
    total,
    records,
    inProgressCount: summaryQuery.data?.inProgress ?? 0,
    sentBackCount: summaryQuery.data?.sentBack ?? 0,
    pendingEvidenceCount: summaryQuery.data?.pendingEvidence ?? 0,
  };
}
