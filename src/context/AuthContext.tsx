import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getStoredPushToken, setStoredPushToken } from "@/lib/pushNotifications";
import { addActionBreadcrumb, clearSentryUser, setSentryUser } from "@/lib/sentry";
import { ApiError } from "@/services/apiClient";
import { authService } from "@/services/auth.service";
import { notificationsApi } from "@/services/notifications.service";
import type { AuthUser, LoginCredentials } from "@/types/auth";
import { resetAttendanceReminder } from "@/utils/attendanceReminder";

type PasswordResetResult = {
  resetOtp?: string | null;
};

type ResetPasswordInput = {
  identifier: string;
  otp: string;
  newPassword: string;
};

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

// Explicit states instead of inferring auth state from user===null combined
// with a separate isLoading boolean - that combination is ambiguous exactly
// when it matters most (a transient bootstrap failure previously had no way
// to distinguish "still resolving" from "resolved as signed out" from
// "resolved as signed in but the profile refetch failed"). Every consumer
// still reads `isAuthenticated`/`isLoading` (derived below) - this is
// additive, not a breaking change to the existing context shape.
type AuthStatus = "bootstrapping" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<PasswordResetResult>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("bootstrapping");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const stored = await authService.getStoredSession();
        if (!stored) {
          if (mounted) setStatus("unauthenticated");
          return;
        }

        setUser(stored.user);

        try {
          const currentUser = await authService.getCurrentUser();
          if (mounted) {
            setUser(currentUser);
            setStatus("authenticated");
            setSentryUser({ id: currentUser.id, role: currentUser.role });
            addActionBreadcrumb("auth", "session_restored");
          }
        } catch (error) {
          // Only a genuine "not authenticated" response should clear the
          // session. apiClient's refresh-then-retry already collapses a
          // truly expired session down to a 401 here - but a network blip,
          // timeout, or backend 5xx during cold launch is not "logged out,"
          // and wiping tokens for one forces a real logout + re-login over
          // what's often just transient connectivity. Resolve as
          // authenticated using the already-cached user in that case, and
          // let a subsequent in-app 401 clear things properly instead.
          const isUnauthorized = error instanceof ApiError && (error.status === 401 || error.status === 403);
          if (isUnauthorized) {
            await authService.clearSession();
            if (mounted) {
              setUser(null);
              setStatus("unauthenticated");
            }
          } else if (mounted) {
            setStatus("authenticated");
            setSentryUser({ id: stored.user.id, role: stored.user.role });
            addActionBreadcrumb("auth", "session_restored");
          }
        }
      } catch {
        // getStoredSession() itself failing is unexpected (it already
        // catches its own JSON.parse error internally) - fail safe to
        // unauthenticated rather than leaving status stuck on
        // "bootstrapping" forever, which would strand the splash screen.
        if (mounted) setStatus("unauthenticated");
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials, rememberMe = true) => {
    addActionBreadcrumb("auth", "login_started");
    const session = await authService.login(credentials, rememberMe);
    setUser(session.user);
    setStatus("authenticated");
    setSentryUser({ id: session.user.id, role: session.user.role });
    addActionBreadcrumb("auth", "login_success");
  }, []);

  const logout = useCallback(async () => {
    // Local sign-out must always complete even if the server-side revoke
    // throws, otherwise a failed network call strands the session on the
    // device - the `finally` below guarantees local state is cleared
    // regardless.
    //
    // Detach this device's push token first, while the session is still
    // valid, so the next user on a shared device doesn't inherit the
    // previous supervisor's notifications. Best-effort: a failed unregister
    // must not block local sign-out.
    const pushToken = getStoredPushToken();
    if (pushToken) {
      await notificationsApi.unregisterPushToken(pushToken).catch(() => undefined);
    }

    try {
      await authService.logout();
    } finally {
      setStoredPushToken(null);
      setUser(null);
      setStatus("unauthenticated");
      resetAttendanceReminder();
      clearSentryUser();
      addActionBreadcrumb("auth", "logout");
      // Drop all cached server data so the next user on a shared device can't
      // see the previous supervisor's customers/expenses/stats/notifications
      // while their own queries refetch.
      queryClient.clear();
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const requestPasswordReset = useCallback(async (identifier: string) => {
    return authService.requestPasswordReset(identifier);
  }, []);

  const resetPassword = useCallback(async (input: ResetPasswordInput) => {
    await authService.resetPassword(input);
  }, []);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    await authService.changePassword(input);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "bootstrapping",
      login,
      logout,
      refreshUser,
      requestPasswordReset,
      resetPassword,
      changePassword,
    }),
    [changePassword, login, logout, refreshUser, requestPasswordReset, resetPassword, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
