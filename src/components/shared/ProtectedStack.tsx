import { Stack } from "expo-router";

import { useAuthGuard } from "@/hooks/useAuthGuard";

export function ProtectedStack() {
  const authGuard = useAuthGuard();

  if (authGuard.blocked) return authGuard.element;

  return <Stack screenOptions={{ headerShown: false }} />;
}

