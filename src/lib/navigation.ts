// Debounces accidental double-taps on a nav-triggering Pressable without
// blocking unrelated navigation elsewhere in the app.
//
// Previously this used a single module-level timestamp shared by every
// caller: ANY guarded navigation anywhere in the app reset the cooldown, so
// a completely unrelated nav tap within 600ms of a prior one was silently
// dropped - no feedback, tap just did nothing. That's indistinguishable
// from a frozen app to the user, and with ~17 call sites sharing one gate,
// it was easy to trigger during normal use (tap a home tile, then tap
// something else shortly after).
//
// Keyed by the `action` closure's own identity instead: two rapid taps on
// the SAME rendered Pressable pass the exact same closure reference (React
// doesn't re-render between two taps that don't change state), so that
// case is still debounced correctly. A tap on a DIFFERENT Pressable is a
// different closure reference and is never blocked by this. WeakMap keys
// don't prevent garbage collection, so these ephemeral per-render closures
// are cleaned up normally once no longer referenced elsewhere.
const lastInvokedAt = new WeakMap<() => void, number>();
const DEBOUNCE_MS = 600;

export function guardNavigation(action: () => void) {
  const now = Date.now();
  const last = lastInvokedAt.get(action) ?? 0;
  if (now - last < DEBOUNCE_MS) return;
  lastInvokedAt.set(action, now);
  action();
}
