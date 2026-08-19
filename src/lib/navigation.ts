let lastNavigationAt = 0;

export function guardNavigation(action: () => void) {
  const now = Date.now();
  if (now - lastNavigationAt < 600) return;
  lastNavigationAt = now;
  action();
}
