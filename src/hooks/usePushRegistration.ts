import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import {
  ensureAndroidChannel,
  ensurePushPermissionGranted,
  getProjectId,
  setStoredPushToken,
} from '@/lib/pushNotifications';
import { useRegisterPushTokenMutation } from '@/queries';

export function usePushRegistration(enabled: boolean) {
  const registerPushTokenMutation = useRegisterPushTokenMutation();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function fetchAndRegister() {
      const projectId = getProjectId();
      if (!projectId) return;
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (cancelled || !token) return;
      setStoredPushToken(token);
      await registerPushTokenMutation.mutateAsync(token);
    }

    async function register() {
      try {
        if (!Device.isDevice) return;
        if (!getProjectId()) return;

        await ensureAndroidChannel();

        const granted = await ensurePushPermissionGranted();
        if (!granted || cancelled) return;

        await fetchAndRegister();
      } catch {
        // Push isn't usable until an EAS project is linked (`eas init`) and the
        // native credentials exist; the in-app notifications list works without
        // it, so this stays a silent no-op until then.
      }
    }

    register();

    // Native (FCM/APNs) tokens can rotate; re-derive and re-register the Expo
    // token so the backend association stays current without a logout/login.
    const rotationSub = Notifications.addPushTokenListener(() => {
      fetchAndRegister().catch(() => undefined);
    });

    return () => {
      cancelled = true;
      rotationSub.remove();
    };
  }, [enabled, registerPushTokenMutation]);
}
