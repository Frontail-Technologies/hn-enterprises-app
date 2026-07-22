import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { notifications as initialNotifications, type Notification } from '@/services/mockData';

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Notification[]>(() => [...initialNotifications]);

  const markAsRead = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

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
