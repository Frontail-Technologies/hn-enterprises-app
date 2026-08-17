// A Pressable's onPress can fire twice in quick succession - a genuine
// double-tap, or a second touch landing while a screen is mid-transition -
// and expo-router's push() has no built-in protection against stacking the
// same route on top of itself. Only one screen transition ever happens at a
// time regardless of which button triggered it, so a single shared timestamp
// is enough to guard every push call site in the app.
let lastNavigationAt = 0;

export function guardNavigation(action: () => void) {
  const now = Date.now();
  if (now - lastNavigationAt < 600) return;
  lastNavigationAt = now;
  action();
}
