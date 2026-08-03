import type { AttendanceHistoryFilter } from "@/types/attendance";

export const attendanceStatusToFilter: Record<string, AttendanceHistoryFilter> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  half_day: "Half Day",
  leave: "Leave",
};

export const attendanceHistoryFilters: AttendanceHistoryFilter[] = [
  "All",
  "Present",
  "Late",
  "Half Day",
  "Leave",
  "Absent",
  "Not Marked",
];
