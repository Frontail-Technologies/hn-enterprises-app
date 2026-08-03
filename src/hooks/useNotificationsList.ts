import { useState } from "react";

import type { Notification } from "@/services/mockData";
import type { NotificationDateFilter, NotificationTypeFilter } from "@/types/notifications";

function matchesDateFilter(value: string, filter: NotificationDateFilter) {
  if (filter === "All") return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (filter === "Today") return itemDay === startOfToday;

  const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
  return itemDay >= sevenDaysAgo && itemDay <= startOfToday;
}

export function useNotificationsList(notifications: Notification[]) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [dateFilter, setDateFilter] = useState<NotificationDateFilter>("All");
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>("All");
  const [dateSelectOpen, setDateSelectOpen] = useState(false);
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    const matchesType = typeFilter === "All" || item.category === typeFilter;
    const matchesDate = matchesDateFilter(item.createdAt, dateFilter);
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
