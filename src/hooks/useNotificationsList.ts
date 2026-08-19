import { useState } from "react";

import type { Notification, NotificationDateFilter, NotificationTypeFilter } from "@/types/notifications";
import { matchesRelativeDateFilter } from "@/utils/dateFilters";

export function useNotificationsList(notifications: Notification[]) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [dateFilter, setDateFilter] = useState<NotificationDateFilter>("All");
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("All");
  const [dateSelectOpen, setDateSelectOpen] = useState(false);
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    const matchesType = typeFilter === "All" || item.category === typeFilter;
    const matchesDate = matchesRelativeDateFilter(item.createdAt, dateFilter);
    return matchesType && matchesDate;
  });

  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    notifications: sortedNotifications,
    selectedNotification,
    setSelectedNotification,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    dateSelectOpen,
    setDateSelectOpen,
    typeSelectOpen,
    setTypeSelectOpen,
  };
}
