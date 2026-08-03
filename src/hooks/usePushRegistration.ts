import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useRegisterPushTokenMutation } from '@/queries';

export function usePushRegistration(enabled: boolean) {
  const registerPushTokenMutation = useRegisterPushTokenMutation();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function register() {
      try {
        if (!Device.isDevice) return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) return;

        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const requested = await Notifications.requestPermissionsAsync();
          status = requested.status;
        }
        if (status !== 'granted') return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
        if (cancelled || !token) return;

        await registerPushTokenMutation.mutateAsync(token);
      } catch {
        // Push isn't set up until an EAS project is linked (`eas init`); the in-app
        // notifications list works fine without it, so this no-ops silently until then.
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [enabled, registerPushTokenMutation]);
}
