import type { WorkProgressStatus } from "@/services/mockData";
import type { WorkQueueFilter } from "@/types/workProgress";

export const workQueueStatusFilters: WorkQueueFilter[] = [
  "All",
  "In Progress",
  "Sent Back",
  "On Hold",
  "Completed",
];

export const editableWorkProgressStatuses: WorkProgressStatus[] = [
  "Pending",
  "In Progress",
  "Completed",
  "Sent Back",
  "On Hold",
];
