import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState, type Href } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

import { useAuth } from '@/context/AuthContext';
import { extractPushData, resolveNotificationHref } from '@/lib/pushNotifications';
import { queryKeys } from '@/queries';
import { notificationsApi } from '@/services/notifications.service';

export function useNotificationObserver() {
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const rootNavState = useRootNavigationState();
  const navReady = Boolean(rootNavState?.key);

  const pendingHrefRef = useRef<Href | null>(null);
  const pendingNotificationIdRef = useRef<string | null>(null);
  const authReadyRef = useRef(false);
  const navReadyRef = useRef(false);

  const consume = useCallback(
    (href: Href, notificationId: string | null) => {
      router.push(href);
      if (notificationId) notificationsApi.markRead(notificationId).catch(() => undefined);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    [queryClient],
  );

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = extractPushData(response.notification.request);
      const href = resolveNotificationHref(data);
      const notificationId = data?.notificationId ?? null;

      // Navigate only once auth is resolved and the router is mounted; otherwise
      // hold the destination and let the effect below flush it.
      if (authReadyRef.current && navReadyRef.current) {
        consume(href, notificationId);
      } else {
        pendingHrefRef.current = href;
        pendingNotificationIdRef.current = notificationId;
      }
    },
    [consume],
  );

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    });
    return () => sub.remove();
  }, [queryClient]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [handleResponse]);

  useEffect(() => {
    let mounted = true;
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (mounted && response) handleResponse(response);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [handleResponse]);

  useEffect(() => {
    authReadyRef.current = isAuthenticated && !isLoading;
    navReadyRef.current = navReady;

    if (!authReadyRef.current || !navReadyRef.current) return;
    const href = pendingHrefRef.current;
    if (!href) return;

    const notificationId = pendingNotificationIdRef.current;
    pendingHrefRef.current = null;
    pendingNotificationIdRef.current = null;
    consume(href, notificationId);
  }, [isAuthenticated, isLoading, navReady, consume]);
}
