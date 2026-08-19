import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationsApi } from "@/services/notifications.service";
import type { Notification } from "@/types/notifications";
import { queryKeys } from "./keys";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: () => notificationsApi.list(),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);

      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (current = []) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);

      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (current = []) =>
        current.map((item) => ({ ...item, read: true })),
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });
      const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications.all);

      queryClient.setQueryData<Notification[]>(queryKeys.notifications.all, (current = []) =>
        current.filter((item) => item.id !== id),
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useRegisterPushTokenMutation() {
  return useMutation({
    mutationFn: (token: string) => notificationsApi.registerPushToken(token),
  });
}
