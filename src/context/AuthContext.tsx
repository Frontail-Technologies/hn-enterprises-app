import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authService } from "@/services/auth.service";
import type { AuthUser, LoginCredentials } from "@/types/auth";

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

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  requestPasswordReset: (identifier: string) => Promise<PasswordResetResult>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const stored = await authService.getStoredSession();
        if (!stored) return;

        setUser(stored.user);
        const currentUser = await authService.getCurrentUser();
        if (mounted) setUser(currentUser);
      } catch {
        await authService.clearSession();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const session = await authService.login(credentials);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

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
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
      requestPasswordReset,
      resetPassword,
      changePassword,
    }),
    [changePassword, isLoading, login, logout, refreshUser, requestPasswordReset, resetPassword, user],
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
