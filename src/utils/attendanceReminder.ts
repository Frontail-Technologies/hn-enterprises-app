let shown = false;

export function hasShownAttendanceReminder() {
  return shown;
}

export function markAttendanceReminderShown() {
  shown = true;
}

export function resetAttendanceReminder() {
  shown = false;
}
