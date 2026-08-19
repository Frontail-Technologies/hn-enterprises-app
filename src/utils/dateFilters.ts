// Shared by useNotificationsList and useActivityListFilters - both had this
// exact function defined independently. Semantics are unchanged from
// either original: dates are compared by local calendar day (not a rolling
// 24h window), and "Last 7 days" includes today (today plus the six days
// before it).
export type RelativeDateFilter = 'All' | 'Today' | 'Last 7 Days';

export function matchesRelativeDateFilter(value: string, filter: RelativeDateFilter): boolean {
  if (filter === 'All') return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (filter === 'Today') return itemDay === startOfToday;

  const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
  return itemDay >= sevenDaysAgo && itemDay <= startOfToday;
}
