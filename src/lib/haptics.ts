import * as Haptics from "expo-haptics";

// Deliberately restrained - reserved for genuinely important confirmations
// (Mark Complete, DPR/Work Planning submit), never per-tap or per-row.
// Wrapped so a device/platform without haptic hardware fails silently
// instead of throwing.
export function successHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
