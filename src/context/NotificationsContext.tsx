import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { notificationsApi } from '@/services/notifications.service';
import type { Notification } from '@/services/mockData';

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      try {
        const rows = await notificationsApi.list();
        if (mounted) setItems(rows);
      } catch {
        // keep whatever was already loaded; the list screen has its own empty state
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const markAsRead = useCallback((id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (!target || target.read) return current;
      return current.map((item) => (item.id === id ? { ...item, read: true } : item));
    });

    notificationsApi.markRead(id).catch(() => {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read: false } : item)));
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const rollback = items;
    setItems((current) => current.map((item) => ({ ...item, read: true })));

    notificationsApi.markAllRead().catch(() => {
      setItems(rollback);
    });
  }, [items]);

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
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return value;
}
