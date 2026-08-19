import { useState } from "react";

import type { ActivityDateFilter, ActivityLogEntry, ActivityTypeFilter } from "@/types/activity";
import { matchesRelativeDateFilter } from "@/utils/dateFilters";

// activity is already sorted newest-first (see activity.service.ts's
// getRecentActivity) - filtering here never needs to re-sort it.
export function useActivityListFilters(activity: ActivityLogEntry[]) {
  const [dateFilter, setDateFilter] = useState<ActivityDateFilter>("All");
  const [typeFilter, setTypeFilter] = useState<ActivityTypeFilter>("All");
  const [dateSelectOpen, setDateSelectOpen] = useState(false);
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);

  const filteredActivity = activity.filter((item) => {
    const matchesType = typeFilter === "All" || item.category === typeFilter;
    const matchesDate = matchesRelativeDateFilter(item.timestamp, dateFilter);
    return matchesType && matchesDate;
  });

  return {
    filteredActivity,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    dateSelectOpen,
    setDateSelectOpen,
    typeSelectOpen,
    setTypeSelectOpen,
  };
}
