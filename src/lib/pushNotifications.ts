import Constants from 'expo-constants';
import type { Href } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type PushRoutePayload = {
  pathname: string;
  params?: Record<string, string>;
};

export type PushData = {
  notificationId?: string;
  type?: string;
  entityId?: string;
  route?: PushRoutePayload;
};

const ANDROID_CHANNEL_ID = 'default';

// Only these destinations may be opened from a notification, so a payload can
// never navigate the app to an arbitrary or unknown screen.
const ALLOWED_PATHNAMES = new Set<string>([
  '/home',
  '/notifications',
  '/attendance',
  '/attendance/[day]',
  '/customers/[id]',
  '/expenses/[id]',
  '/complaints',
  '/work/[id]',
]);

let currentPushToken: string | null = null;

export function getStoredPushToken(): string | null {
  return currentPushToken;
}

export function setStoredPushToken(token: string | null): void {
  currentPushToken = token;
}

export function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

// Foreground presentation: still show the banner/list and keep the app-icon
// badge in sync; the in-app list stays the canonical source and is refetched
// by the notification observer.
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    vibrationPattern: [0, 250, 250, 250],
  });
}

// Requests permission only when the OS hasn't decided yet (or still allows a
// prompt). A prior denial is respected instead of re-prompting on every launch.
export async function ensurePushPermissionGranted(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (current.status === 'undetermined' || current.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted || requested.status === 'granted';
  }
  return false;
}

export function extractPushData(request: Notifications.NotificationRequest | undefined): PushData | undefined {
  const raw = request?.content?.data;
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as PushData;
}

function hrefFromType(type: string | undefined, entityId: string | undefined): Href | null {
  if (type === 'complaint') return '/complaints';
  if (!entityId) return null;
  switch (type) {
    case 'customer':
      return { pathname: '/customers/[id]', params: { id: entityId } };
    case 'expense':
    case 'payment':
      return { pathname: '/expenses/[id]', params: { id: entityId } };
    case 'work':
    case 'dpr':
      return { pathname: '/work/[id]', params: { id: entityId } };
    default:
      return null;
  }
}

// Maps a notification payload to a known route. Prefers the backend-supplied
// route when it's on the allow-list, then falls back to a type/entity mapping,
// and finally to the Notifications screen so an unknown type is always safe.
export function resolveNotificationHref(data: PushData | undefined): Href {
  const route = data?.route;
  if (route?.pathname && ALLOWED_PATHNAMES.has(route.pathname)) {
    return { pathname: route.pathname, params: route.params } as Href;
  }
  return hrefFromType(data?.type, data?.entityId) ?? '/notifications';
}
