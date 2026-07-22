import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { CapturedLocation } from '@/hooks/useCurrentLocation';
import { toDateKey } from '@/utils/date';

const STORAGE_KEY = 'attendance:today:v1';

type StoredAttendance = {
  dateKey: string;
  checkInAt?: string;
  checkOutAt?: string;
  checkInLocation?: CapturedLocation;
  checkOutLocation?: CapturedLocation;
  markedAt?: string;
  location?: CapturedLocation;
};

type AttendanceState = {
  loading: boolean;
  isCheckedInToday: boolean;
  isCheckedOutToday: boolean;
  checkInAt?: string;
  checkOutAt?: string;
  checkInLocation?: CapturedLocation;
  checkOutLocation?: CapturedLocation;
  isMarkedToday: boolean;
  markedAt?: string;
  location?: CapturedLocation;
};

type AttendanceContextValue = AttendanceState & {
  checkIn: (location: CapturedLocation) => Promise<void>;
  checkOut: (location: CapturedLocation) => Promise<void>;
  markAttendance: (location: CapturedLocation) => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AttendanceState>({
    loading: true,
    isCheckedInToday: false,
    isCheckedOutToday: false,
    isMarkedToday: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadAttendance() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const todayKey = toDateKey(new Date());

        if (!stored) {
          if (mounted) {
            setState({
              loading: false,
              isCheckedInToday: false,
              isCheckedOutToday: false,
              isMarkedToday: false,
            });
          }
          return;
        }

        const parsed = JSON.parse(stored) as StoredAttendance;

        if (parsed.dateKey !== todayKey) {
          if (mounted) {
            setState({
              loading: false,
              isCheckedInToday: false,
              isCheckedOutToday: false,
              isMarkedToday: false,
            });
          }
          return;
        }

        if (mounted) {
          const checkInAt = parsed.checkInAt ?? parsed.markedAt;
          const checkInLocation = parsed.checkInLocation ?? parsed.location;

          setState({
            loading: false,
            isCheckedInToday: Boolean(checkInAt),
            isCheckedOutToday: Boolean(parsed.checkOutAt),
            checkInAt,
            checkOutAt: parsed.checkOutAt,
            checkInLocation,
            checkOutLocation: parsed.checkOutLocation,
            isMarkedToday: Boolean(checkInAt),
            markedAt: checkInAt,
            location: checkInLocation,
          });
        }
      } catch {
        if (mounted) {
          setState({
            loading: false,
            isCheckedInToday: false,
            isCheckedOutToday: false,
            isMarkedToday: false,
          });
        }
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, []);

  const checkIn = useCallback(async (location: CapturedLocation) => {
    const checkInAt = new Date().toISOString();
    const payload: StoredAttendance = {
      dateKey: toDateKey(new Date()),
      checkInAt,
      checkInLocation: location,
      checkOutAt: state.checkOutAt,
      checkOutLocation: state.checkOutLocation,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setState({
      loading: false,
      isCheckedInToday: true,
      isCheckedOutToday: Boolean(state.checkOutAt),
      checkInAt,
      checkOutAt: state.checkOutAt,
      checkInLocation: location,
      checkOutLocation: state.checkOutLocation,
      isMarkedToday: true,
      markedAt: checkInAt,
      location,
    });
  }, [state.checkOutAt, state.checkOutLocation]);

  const checkOut = useCallback(async (location: CapturedLocation) => {
    const checkOutAt = new Date().toISOString();
    const checkInAt = state.checkInAt ?? new Date().toISOString();
    const checkInLocation = state.checkInLocation ?? location;
    const payload: StoredAttendance = {
      dateKey: toDateKey(new Date()),
      checkInAt,
      checkInLocation,
      checkOutAt,
      checkOutLocation: location,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setState({
      loading: false,
      isCheckedInToday: true,
      isCheckedOutToday: true,
      checkInAt,
      checkOutAt,
      checkInLocation,
      checkOutLocation: location,
      isMarkedToday: true,
      markedAt: checkInAt,
      location: checkInLocation,
    });
  }, [state.checkInAt, state.checkInLocation]);

  const markAttendance = checkIn;

  const value = useMemo<AttendanceContextValue>(
    () => ({
      ...state,
      checkIn,
      checkOut,
      markAttendance,
    }),
    [checkIn, checkOut, markAttendance, state],
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendanceStatus() {
  const value = useContext(AttendanceContext);

  if (!value) {
    throw new Error('useAttendanceStatus must be used within AttendanceProvider');
  }

  return value;
}
