import type { ReactNode } from "react";
import { Redirect } from "expo-router";

import { useAuth } from "@/context/AuthContext";

type AuthGuardResult = { blocked: true; element: ReactNode } | { blocked: false };

// Centralizes the auth-guard logic that route-group layouts already share
// via ProtectedStack (attendance/, customers/, expenses/, planning/,
// stats/, work/) for the handful of standalone screens that have no
// wrapping _layout.tsx to inherit that from (activity, complaints,
// notifications, profile) - they were each hand-copying this same
// two-line check instead. One of those copies (profile.tsx) had silently
// dropped the `isLoading` check, so it could incorrectly redirect an
// already-logged-in user to /login during the auth-bootstrap window
// (isAuthenticated is still false there, not because the user is signed
// out, but because resolution hasn't finished) - exactly the kind of
// auth-state oscillation a single shared implementation is meant to
// prevent by construction.
export function useAuthGuard(): AuthGuardResult {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return { blocked: true, element: null };
  if (!isAuthenticated) return { blocked: true, element: <Redirect href="/auth/login" /> };

  return { blocked: false };
}
