import { apiRequest } from "./apiClient";
import type { Notification, NotificationCategory } from "./mockData";

type BackendNotificationCategory = "work" | "attendance" | "survey" | "system";

type BackendNotification = {
  id: string;
  title: string;
  message: string;
  category: BackendNotificationCategory;
  route: { pathname: string; params?: Record<string, string> } | null;
  read: boolean;
  createdAt: string;
};

const CATEGORY_TO_FRONTEND: Record<BackendNotificationCategory, NotificationCategory> = {
  work: "Work",
  attendance: "Attendance",
  survey: "Survey",
  system: "System",
};

function mapNotification(raw: BackendNotification): Notification {
  return {
    id: raw.id,
    title: raw.title,
    message: raw.message,
    category: CATEGORY_TO_FRONTEND[raw.category] ?? "System",
    createdAt: raw.createdAt,
    read: raw.read,
    route: raw.route ?? undefined,
  };
}

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const rows = await apiRequest<BackendNotification[]>("/notifications");
    return rows.map(mapNotification);
  },

  async markRead(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllRead(): Promise<void> {
    await apiRequest("/notifications/mark-all-read", { method: "POST" });
  },

  async registerPushToken(token: string): Promise<void> {
    await apiRequest("/push-tokens", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  },
};
