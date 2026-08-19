// Shared by every infinite-list hook (Customers, Work Queue, Expenses) as a
// safety net against duplicate rows across page boundaries - an unstable
// sort tie-break on the backend (or any other pagination hiccup) could
// otherwise hand back the same record on two pages, which would crash a
// FlashList on a duplicate key.
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}
