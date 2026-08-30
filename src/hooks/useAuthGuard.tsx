import type { ReactNode } from "react";
import { Redirect } from "expo-router";

import { useAuth } from "@/context/AuthContext";

type AuthGuardResult = { blocked: true; element: ReactNode } | { blocked: false };

export function useAuthGuard(): AuthGuardResult {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return { blocked: true, element: null };
  if (!isAuthenticated) return { blocked: true, element: <Redirect href="/auth/login" /> };

  return { blocked: false };
}
