// AttendanceProvider is mounted at the root, above any route-level auth
// guard, so without this the query would fire before a token exists (during
// boot) or after logout - not a retry-worthy error, just a request that has
// no business being made yet.
export function isAttendanceQueryEnabled(authLoading: boolean, userId: string | null): boolean {
  return !authLoading && Boolean(userId);
}
