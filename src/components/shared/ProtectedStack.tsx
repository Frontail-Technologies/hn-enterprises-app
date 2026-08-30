import { Stack } from "expo-router";

import { useTheme } from "@/context/ThemeContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export function ProtectedStack() {
  const { colors } = useTheme();
  const authGuard = useAuthGuard();

  if (authGuard.blocked) return authGuard.element;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}

