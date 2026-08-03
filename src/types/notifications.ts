import type { NotificationCategory } from "@/services/mockData";

export type NotificationDateFilter = "All" | "Today" | "Last 7 Days";
export type NotificationTypeFilter = "All" | NotificationCategory;
