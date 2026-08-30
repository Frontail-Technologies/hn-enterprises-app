export function isAttendanceQueryEnabled(authLoading: boolean, userId: string | null): boolean {
  return !authLoading && Boolean(userId);
}
