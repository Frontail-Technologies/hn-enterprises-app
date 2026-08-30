const lastInvokedAt = new WeakMap<() => void, number>();
const DEBOUNCE_MS = 600;

export function guardNavigation(action: () => void) {
  const now = Date.now();
  const last = lastInvokedAt.get(action) ?? 0;
  if (now - last < DEBOUNCE_MS) return;
  lastInvokedAt.set(action, now);
  action();
}
