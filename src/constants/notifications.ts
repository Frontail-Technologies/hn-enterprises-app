import type { NotificationDateFilter, NotificationTypeFilter } from "@/types/notifications";

export const notificationDateFilters: { label: string; value: NotificationDateFilter }[] = [
  { label: "All Dates", value: "All" },
  { label: "Today", value: "Today" },
  { label: "Last 7 Days", value: "Last 7 Days" },
];

export const notificationTypeFilters: { label: string; value: NotificationTypeFilter }[] = [
  { label: "All Types", value: "All" },
  { label: "Work", value: "Work" },
  { label: "Attendance", value: "Attendance" },
  { label: "Survey", value: "Survey" },
  { label: "System", value: "System" },
];
