import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export type CapturedLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address?: string;
  capturedAt: string;
};

type LocationState = {
  location: CapturedLocation | null;
  loading: boolean;
  error: string | null;
};

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
  });

  const captureLocation = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        throw new Error('Location permission is required.');
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const reverse = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
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

      setState({ location, loading: false, error: null });
      return location;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to capture location.';
      setState((current) => ({ ...current, loading: false, error: message }));
      return null;
    }
  }, []);

  return {
    ...state,
    captureLocation,
    hasLocation: Boolean(state.location),
  };
}
