import type { ActivityDateFilter, ActivityTypeFilter } from "@/types/activity";

export const activityDateFilters: { label: string; value: ActivityDateFilter }[] = [
  { label: "All Dates", value: "All" },
  { label: "Today", value: "Today" },
  { label: "Last 7 Days", value: "Last 7 Days" },
];

export const activityTypeFilters: { label: string; value: ActivityTypeFilter }[] = [
  { label: "All Types", value: "All" },
  { label: "Work", value: "Work" },
  { label: "Attendance", value: "Attendance" },
  { label: "Survey", value: "Survey" },
  { label: "System", value: "System" },
];
