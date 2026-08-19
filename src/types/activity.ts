import type { NotificationCategory } from "@/types/notifications";

export type ActivityLogEntry = {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  timestamp: string;
  route?: {
    pathname: string;
    params?: Record<string, string>;
  };
};

export type ActivityDateFilter = "All" | "Today" | "Last 7 Days";
export type ActivityTypeFilter = "All" | NotificationCategory;
