import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { CapturedLocation } from '@/hooks/useCurrentLocation';
import { attendanceApi, type BackendAttendanceRecord } from '@/services/attendance.service';
import { toDateKey } from '@/utils/date';

const CACHE_KEY = 'attendance:today:v1';

type CachedAttendance = {
  dateKey: string;
  record: BackendAttendanceRecord | null;
};

type AttendanceState = {
  loading: boolean;
  isCheckedInToday: boolean;
  isCheckedOutToday: boolean;
  checkInAt?: string;
  checkOutAt?: string;
  checkInLocation?: CapturedLocation;
  checkOutLocation?: CapturedLocation;
};

type AttendanceContextValue = AttendanceState & {
  checkIn: (location: CapturedLocation) => Promise<void>;
  checkOut: (location: CapturedLocation, remarks?: string) => Promise<void>;
  refetch: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

function toState(record: BackendAttendanceRecord | null): Omit<AttendanceState, 'loading'> {
  return {
    isCheckedInToday: Boolean(record?.checkInAt),
    isCheckedOutToday: Boolean(record?.checkOutAt),
    checkInAt: record?.checkInAt ?? undefined,
    checkOutAt: record?.checkOutAt ?? undefined,
    checkInLocation: record?.checkInLocation ?? undefined,
    checkOutLocation: record?.checkOutLocation ?? undefined,
  };
}

async function cacheRecord(dateKey: string, record: BackendAttendanceRecord | null) {
  const payload: CachedAttendance = { dateKey, record };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function AttendanceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AttendanceState>({
    loading: true,
    isCheckedInToday: false,
    isCheckedOutToday: false,
  });

  useEffect(() => {
    let mounted = true;

    async function loadAttendance() {
      const todayKey = toDateKey(new Date());

      // Paint the cached value first for instant UI, then reconcile with the server below.
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && mounted) {
          const parsed = JSON.parse(cached) as CachedAttendance;
          if (parsed.dateKey === todayKey) {
            setState({ loading: true, ...toState(parsed.record) });
          }
        }
      } catch {
        // ignore corrupt cache, server fetch below is authoritative
      }

      try {
        const record = await attendanceApi.getDay(todayKey);
        if (!mounted) return;
        setState({ loading: false, ...toState(record) });
        await cacheRecord(todayKey, record);
      } catch {
        if (mounted) setState((current) => ({ ...current, loading: false }));
      }
    }

    loadAttendance();

    return () => {
      mounted = false;
    };
  }, []);

  // Re-fetches today's record from the server without the cache-paint step above -
  // used by screens' pull-to-refresh (Screen's `onRefresh`), which already has
  // something on screen and just wants the latest state.
  const refetch = useCallback(async () => {
    const todayKey = toDateKey(new Date());
    try {
      const record = await attendanceApi.getDay(todayKey);
      setState({ loading: false, ...toState(record) });
      await cacheRecord(todayKey, record);
    } catch {
      // keep showing the last known state if the refresh fails
    }
  }, []);

  const checkIn = useCallback(
    async (location: CapturedLocation) => {
      const rollback = state;
      const todayKey = toDateKey(new Date());
      setState((current) => ({
        ...current,
        isCheckedInToday: true,
        checkInAt: location.capturedAt,
        checkInLocation: location,
      }));

      try {
        const record = await attendanceApi.checkIn(todayKey, location);
        setState({ loading: false, ...toState(record) });
        await cacheRecord(todayKey, record);
      } catch (error) {
        setState(rollback);
        throw error;
      }
    },
    [state],
  );

  const checkOut = useCallback(
    async (location: CapturedLocation, remarks?: string) => {
      const rollback = state;
      const todayKey = toDateKey(new Date());
      setState((current) => ({
        ...current,
        isCheckedOutToday: true,
        checkOutAt: location.capturedAt,
        checkOutLocation: location,
      }));

      try {
        const record = await attendanceApi.checkOut(todayKey, location, remarks);
        setState({ loading: false, ...toState(record) });
        await cacheRecord(todayKey, record);
      } catch (error) {
        setState(rollback);
        throw error;
      }
    },
    [state],
  );

  const value = useMemo<AttendanceContextValue>(
    () => ({ ...state, checkIn, checkOut, refetch }),
    [checkIn, checkOut, refetch, state],
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
