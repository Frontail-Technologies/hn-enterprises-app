import * as Notifications from "expo-notifications";
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo } from "react";

import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/queries";
import type { Notification } from "@/types/notifications";

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const notificationsQuery = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const items = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount).catch(() => undefined);
  }, [unreadCount]);

  const markAsRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id);
    },
    [markReadMutation],
  );

  const markAllAsRead = useCallback(() => {
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const deleteNotification = useCallback(
    (id: string) => {
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: items,
      unreadCount,
      isLoading: notificationsQuery.isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [items, unreadCount, markAllAsRead, markAsRead, deleteNotification, notificationsQuery.isLoading],
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
