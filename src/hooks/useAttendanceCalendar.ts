import { useMemo, useState } from "react";

import { attendanceStatusToFilter } from "@/constants/attendance";
import { useAttendanceMonthQuery } from "@/queries";
import type { BackendAttendanceRecord } from "@/services/attendance.service";
import type { AttendanceHistoryFilter } from "@/types/attendance";
import { addMonths, startOfDay, toDateKey } from "@/utils/date";

export type AttendanceCalendarCell =
  | null
  | {
      day: number;
      dateKey: string;
      status: AttendanceHistoryFilter | "Future";
      disabled: boolean;
    };

function buildCalendar(
  monthDate: Date,
  filter: AttendanceHistoryFilter,
  recordsByDate: Map<string, BackendAttendanceRecord>,
): AttendanceCalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayIndex = (firstDay.getDay() + 6) % 7;
  const today = new Date();
  const cells: AttendanceCalendarCell[] = Array.from({ length: mondayIndex }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const isFuture = startOfDay(date).getTime() > startOfDay(today).getTime();
    const record = recordsByDate.get(dateKey);
    const baseStatus: AttendanceHistoryFilter = record
      ? (attendanceStatusToFilter[record.status] ?? "Not Marked")
      : "Not Marked";
    const status: AttendanceHistoryFilter | "Future" = isFuture ? "Future" : baseStatus;
    const matchesFilter = filter === "All" || baseStatus === filter;

    cells.push(matchesFilter || isFuture ? { day, dateKey, status, disabled: isFuture } : null);
  }

  return cells;
}

export function useAttendanceCalendar() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [filter, setFilter] = useState<AttendanceHistoryFilter>("All");
  const monthKey = useMemo(
    () => `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
    [monthDate],
  );
  const { data: records = [] } = useAttendanceMonthQuery(monthKey);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, BackendAttendanceRecord>();
    records.forEach((record) => map.set(record.date, record));
    return map;
  }, [records]);

  const calendarDays = useMemo(
    () => buildCalendar(monthDate, filter, recordsByDate),
    [filter, monthDate, recordsByDate],
  );
  const visibleDays = calendarDays.filter(Boolean) as Exclude<AttendanceCalendarCell, null>[];
  const presentCount = visibleDays.filter((item) => item.status === "Present").length;
  const lateCount = visibleDays.filter((item) => item.status === "Late").length;
  const absentCount = visibleDays.filter((item) => item.status === "Absent").length;
  const monthTitle = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(monthDate);

  return {
    monthDate,
    goToPreviousMonth: () => setMonthDate((value) => addMonths(value, -1)),
    goToNextMonth: () => setMonthDate((value) => addMonths(value, 1)),
    monthTitle,
    filter,
    setFilter,
    calendarDays,
    presentCount,
    lateCount,
    absentCount,
  };
}
