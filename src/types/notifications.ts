export type NotificationCategory = 'Work' | 'Attendance' | 'Survey' | 'System';

export type Notification = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  createdAt: string;
  read: boolean;
  route?: {
    pathname: string;
    params?: Record<string, string>;
  };
};

export type NotificationDateFilter = "All" | "Today" | "Last 7 Days";
export type NotificationTypeFilter = "All" | NotificationCategory;
