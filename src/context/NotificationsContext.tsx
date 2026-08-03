import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";

import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/queries";
import type { Notification } from "@/services/mockData";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const items = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);

  const markAsRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  const markAllAsRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: items,
      unreadCount: items.filter((item) => !item.read).length,
      markAsRead,
      markAllAsRead,
    }),
    [items, markAllAsRead, markAsRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const value = useContext(NotificationsContext);

  if (!value) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return value;
}
