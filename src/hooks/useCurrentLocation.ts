import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

export type CapturedLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string;
  capturedAt: string;
};

// Lets callers (e.g. the Check-In button) show the exact guidance the
// situation calls for - "enable Location Services" vs "open Settings to
// grant permission" vs a plain retry - instead of one generic error string.
export type LocationErrorKind =
  | 'services_disabled'
  | 'permission_denied'
  | 'permission_denied_permanently'
  | 'timeout'
  | 'unknown';

type LocationState = {
  location: CapturedLocation | null;
  loading: boolean;
  error: string | null;
  errorKind: LocationErrorKind | null;
};

// expo-location's getCurrentPositionAsync has no built-in timeout - on poor
// or absent GPS signal (common indoors) it can hang far longer than a user
// will wait. Without a bound here, the Check-In button's spinner never
// resolves, and if the user gives up and navigates away while the native
// permission/location call is still in flight, the resulting OS dialog can
// surface later on whatever screen they've since moved to. Bounding the
// wait client-side turns that into a clear, immediate error instead.
const POSITION_TIMEOUT_MS = 15000;

class LocationTimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new LocationTimeoutError('Location request timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    errorKind: null,
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Re-entrant calls (a second tap that slips through before the button's
  // own disabled-while-loading state re-renders, or two independent callers
  // sharing intent) return the same in-flight promise instead of racing two
  // native permission/location requests against each other.
  const inFlightRef = useRef<Promise<CapturedLocation | null> | null>(null);

  // A caller that does `const captured = await captureLocation(); if
  // (!captured) { ...read the failure reason... }` runs that check in the
  // same tick the promise resolves, before React has re-rendered with the
  // new state - reading `state.error`/`state.errorKind` there would be
  // stale. This ref is set synchronously at the same point as the state
  // update, so a getter reading it right after `await` is always current.
  const lastErrorRef = useRef<{ message: string; kind: LocationErrorKind } | null>(null);

  const captureLocation = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current;

    const run = async (): Promise<CapturedLocation | null> => {
      if (mountedRef.current) {
        setState((current) => ({ ...current, loading: true, error: null, errorKind: null }));
      }

      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          throw Object.assign(new Error('Location Services are turned off. Enable them in Settings to continue.'), {
            kind: 'services_disabled' as const,
          });
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          const kind: LocationErrorKind = permission.canAskAgain
            ? 'permission_denied'
            : 'permission_denied_permanently';
          throw Object.assign(
            new Error(
              kind === 'permission_denied_permanently'
                ? 'Location access is denied. Open Settings to allow it.'
                : 'Location permission is required.',
            ),
            { kind },
          );
        }

        const current = await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          POSITION_TIMEOUT_MS,
        );
        const reverse = await Location.reverseGeocodeAsync({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        }).catch(() => []);
        const firstAddress = reverse[0];
        const address = firstAddress
          ? [firstAddress.name, firstAddress.street, firstAddress.city, firstAddress.region]
              .filter(Boolean)
              .join(', ')
          : undefined;

        const location: CapturedLocation = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          accuracy: current.coords.accuracy,
          address,
          capturedAt: new Date().toISOString(),
        };

        lastErrorRef.current = null;
        if (mountedRef.current) setState({ location, loading: false, error: null, errorKind: null });
        return location;
      } catch (error) {
        const kind: LocationErrorKind =
          error instanceof LocationTimeoutError
            ? 'timeout'
            : (error as { kind?: LocationErrorKind })?.kind ?? 'unknown';
        const message =
          kind === 'timeout'
            ? "Couldn't get a location fix in time. Try again, ideally outdoors or near a window."
            : error instanceof Error
              ? error.message
              : 'Unable to capture location.';

        lastErrorRef.current = { message, kind };
        if (mountedRef.current) {
          setState((current) => ({ ...current, loading: false, error: message, errorKind: kind }));
        }
        return null;
      }
    };

    const promise = run().finally(() => {
      inFlightRef.current = null;
    });
    inFlightRef.current = promise;
    return promise;
  }, []);

  const openLocationSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const getLastLocationError = useCallback(() => lastErrorRef.current, []);

  return {
    ...state,
    captureLocation,
    openLocationSettings,
    getLastLocationError,
    hasLocation: Boolean(state.location),
  };
}
