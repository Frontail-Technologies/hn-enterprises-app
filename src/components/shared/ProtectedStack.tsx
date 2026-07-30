import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export function ProtectedStack() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

