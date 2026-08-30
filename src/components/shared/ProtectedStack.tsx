import { Stack } from "expo-router";

import { useTheme } from "@/context/ThemeContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

// Shared nested Stack for every protected route group (attendance/, customers/, expenses/,
// planning/, stats/, work/) - contentStyle is what React Navigation's native-stack paints as each
// screen's own background during a push/pop transition; left unset it defaults to white regardless
// of app theme, showing as a flash on every push/back navigation within these route groups. Fixed
// once here rather than per-screen since all six share this one component (see app/_layout.tsx's
// ThemedStack for the equivalent fix on the root Stack).
export function ProtectedStack() {
  const { colors } = useTheme();
  const authGuard = useAuthGuard();

  if (authGuard.blocked) return authGuard.element;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}

