import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { isAttendanceQueryEnabled } from '@/context/attendanceGating';
import { useAuth } from '@/context/AuthContext';
import type { CapturedLocation } from '@/hooks/useCurrentLocation';
import { queryKeys } from '@/queries/keys';
import { useAttendanceDayQuery, useCheckInMutation, useCheckOutMutation } from '@/queries/attendance.queries';
import type { BackendAttendanceRecord } from '@/services/attendance.service';
import { toDateKey } from '@/utils/date';

function cacheKey(userId: string) {
  return `attendance:today:v1:${userId}`;
}

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
  checkingIn: boolean;
  checkingOut: boolean;
  checkIn: (location: CapturedLocation) => Promise<void>;
  checkOut: (location: CapturedLocation, remarks?: string) => Promise<void>;
  refetch: () => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

function toState(record: BackendAttendanceRecord | null | undefined): Omit<AttendanceState, 'loading'> {
  return {
    isCheckedInToday: Boolean(record?.checkInAt),
    isCheckedOutToday: Boolean(record?.checkOutAt),
    checkInAt: record?.checkInAt ?? undefined,
    checkOutAt: record?.checkOutAt ?? undefined,
    checkInLocation: record?.checkInLocation ?? undefined,
    checkOutLocation: record?.checkOutLocation ?? undefined,
  };
}

export function AttendanceProvider({ children }: PropsWithChildren) {
  const todayKey = toDateKey(new Date());
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const dayQuery = useAttendanceDayQuery(todayKey, { enabled: isAttendanceQueryEnabled(authLoading, userId) });
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    AsyncStorage.getItem(cacheKey(userId))
      .then((cached) => {
        if (!cached || cancelled) return;
        const parsed = JSON.parse(cached) as CachedAttendance;
        if (parsed.dateKey !== todayKey) return;

        const dayKey = queryKeys.attendance.day(todayKey);
        const current = queryClient.getQueryState<BackendAttendanceRecord | null>(dayKey);
        if (current?.data !== undefined) return;

        queryClient.setQueryData(dayKey, parsed.record);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [queryClient, todayKey, userId]);

  useEffect(() => {
    if (!userId || dayQuery.isLoading || dayQuery.data === undefined) return;
    const payload: CachedAttendance = { dateKey: todayKey, record: dayQuery.data };
    void AsyncStorage.setItem(cacheKey(userId), JSON.stringify(payload)).catch(() => undefined);
  }, [todayKey, userId, dayQuery.data, dayQuery.isLoading]);

  const refetch = useCallback(async () => {
    await dayQuery.refetch();
  }, [dayQuery]);

  const checkIn = useCallback(
    async (location: CapturedLocation) => {
      await checkInMutation.mutateAsync({ date: todayKey, location });
    },
    [checkInMutation, todayKey],
  );

  const checkOut = useCallback(
    async (location: CapturedLocation, remarks?: string) => {
      await checkOutMutation.mutateAsync({ date: todayKey, location, remarks });
    },
    [checkOutMutation, todayKey],
  );

  const value = useMemo<AttendanceContextValue>(
    () => ({
      loading: dayQuery.isLoading,
      ...toState(dayQuery.data),
      checkingIn: checkInMutation.isPending,
      checkingOut: checkOutMutation.isPending,
      checkIn,
      checkOut,
      refetch,
    }),
    [dayQuery.isLoading, dayQuery.data, checkInMutation.isPending, checkOutMutation.isPending, checkIn, checkOut, refetch],
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
