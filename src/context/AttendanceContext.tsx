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

// Paints today's attendance instantly on a cold launch, before the network
// responds (React Query's cache is in-memory only and starts empty). This is
// a mirror of the query cache, not a second source of truth - read once to
// prime the query's own cache entry, written back only from that query's
// settled result.
//
// Scoped by user id, like `useDraftForm`'s drafts - otherwise a check-in on
// a shared device could prime the next logged-in user's "today" as the
// previous user's.
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

  // Same query/mutation hooks the Attendance History/Day-detail screens use,
  // so a check-in/out here updates the one cache entry every screen reads.
  //
  // Gated on auth being resolved AND a user existing: this provider is
  // mounted at the root, above any route-level auth guard, so without this
  // the query would fire before a token exists (during boot) or after
  // logout - not a retry-worthy error, just a request with no business being
  // made yet.
  const dayQuery = useAttendanceDayQuery(todayKey, { enabled: isAttendanceQueryEnabled(authLoading, userId) });
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // Cold-start priming: read the last known on-device snapshot once and, if
  // the query hasn't already resolved (from a real fetch) by the time this
  // resolves, seed its cache entry so the first render has something to show.
  // Guarded against the live query state (not a captured value) so a fast
  // network response that lands first is never clobbered by a stale snapshot.
  // No-ops without an authenticated user, same as `useDraftForm`.
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

  // Mirrors the settled query result back to disk for the next cold start.
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
