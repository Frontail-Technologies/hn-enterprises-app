import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { attendanceApi } from "@/services/attendance.service";
import type { CapturedLocation } from "@/hooks/useCurrentLocation";
import { queryKeys } from "./keys";

export function useAttendanceMonthQuery(month: string) {
  return useQuery({
    queryKey: queryKeys.attendance.month(month),
    queryFn: () => attendanceApi.getMonth(month),
  });
}

export function useAttendanceDayQuery(date: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attendance.day(date ?? ""),
    queryFn: () => attendanceApi.getDay(date as string),
    enabled: Boolean(date),
  });
}

export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, location }: { date: string; location: CapturedLocation }) =>
      attendanceApi.checkIn(date, location),
    onSuccess: (record) => {
      const month = record.date.slice(0, 7);
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.month(month) });
      queryClient.setQueryData(queryKeys.attendance.day(record.date), record);
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, location, remarks }: { date: string; location: CapturedLocation; remarks?: string }) =>
      attendanceApi.checkOut(date, location, remarks),
    onSuccess: (record) => {
      const month = record.date.slice(0, 7);
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.month(month) });
      queryClient.setQueryData(queryKeys.attendance.day(record.date), record);
    },
  });
}
