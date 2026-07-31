import { apiRequest } from "./apiClient";
import type { CapturedLocation } from "@/hooks/useCurrentLocation";

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "leave";

export type BackendAttendanceRecord = {
  id: string;
  userId: string;
  date: string;
  status: AttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInLocation: CapturedLocation | null;
  checkOutLocation: CapturedLocation | null;
  remarks: string | null;
  markedBy: string | null;
};

export const attendanceApi = {
  async checkIn(date: string, location: CapturedLocation): Promise<BackendAttendanceRecord> {
    return apiRequest<BackendAttendanceRecord>("/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({ date, location }),
    });
  },

  async checkOut(date: string, location: CapturedLocation): Promise<BackendAttendanceRecord> {
    return apiRequest<BackendAttendanceRecord>("/attendance/check-out", {
      method: "POST",
      body: JSON.stringify({ date, location }),
    });
  },

  async getMonth(month: string): Promise<BackendAttendanceRecord[]> {
    return apiRequest<BackendAttendanceRecord[]>(`/attendance/me?month=${month}`);
  },

  async getDay(date: string): Promise<BackendAttendanceRecord | null> {
    return apiRequest<BackendAttendanceRecord | null>(`/attendance/me/${date}`);
  },
};
