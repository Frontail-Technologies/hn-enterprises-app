import { useMemo, useState } from "react";

import type { WorkProgressRecord } from "@/services/mockData";
import type { WorkQueueFilter } from "@/types/workProgress";

function uniqueOptions(records: WorkProgressRecord[], pick: (record: WorkProgressRecord) => string) {
  return ["All", ...Array.from(new Set(records.map(pick)))];
}

export function useWorkQueueFilters(records: WorkProgressRecord[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<WorkQueueFilter>("All");
  const [projectFilter, setProjectFilter] = useState("All");
  const [siteFilter, setSiteFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  const projectOptions = useMemo(() => uniqueOptions(records, (record) => record.projectName), [records]);
  const siteOptions = useMemo(() => uniqueOptions(records, (record) => record.siteArea), [records]);
  const stageOptions = useMemo(() => uniqueOptions(records, (record) => record.currentStage), [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    const statusFiltered = records.filter((record) => {
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesProject = projectFilter === "All" || record.projectName === projectFilter;
      const matchesSite = siteFilter === "All" || record.siteArea === siteFilter;
      const matchesStage = stageFilter === "All" || record.currentStage === stageFilter;

      return matchesStatus && matchesProject && matchesSite && matchesStage;
    });

    if (!query) return statusFiltered;

    return statusFiltered.filter((record) =>
      [
        record.customerName,
        record.bpTrNumber,
        record.mobileNumber,
        record.projectName,
        record.siteArea,
        record.currentStage,
        record.nextRequiredAction,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [statusFilter, projectFilter, search, siteFilter, stageFilter, records]);

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
    records: filteredRecords,
  };
}
