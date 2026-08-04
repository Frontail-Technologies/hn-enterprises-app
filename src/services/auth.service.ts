import * as SecureStore from "expo-secure-store";

import {
  apiRequest,
  clearTokens,
  getRefreshToken,
  setTokens,
} from "@/services/apiClient";
import type { AuthSession, AuthUser, LoginCredentials } from "@/types/auth";

const USER_KEY = "hn_auth_user";

type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

type PasswordResetRequestResponse = {
  resetOtp?: string | null;
};

export const authService = {
  async login(credentials: LoginCredentials, rememberMe = true): Promise<AuthSession> {
    const data = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password,
        clientType: "mobile",
      }),
    });

    await persistSession(data, rememberMe);
    return data;
  },

  async getStoredSession(): Promise<AuthSession | null> {
    const [userJson, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(USER_KEY),
      getRefreshToken(),
    ]);

    if (!userJson || !refreshToken) return null;

    try {
      const user = JSON.parse(userJson) as AuthUser;
      return { user, accessToken: "", refreshToken };
    } catch {
      await this.clearSession();
      return null;
    }
  },

  async getCurrentUser(): Promise<AuthUser> {
    return apiRequest<AuthUser>("/auth/me");
  },

  async logout() {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      await apiRequest<void>("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${refreshToken}` },
        skipRefresh: true,
      }).catch(() => undefined);
    }

    await this.clearSession();
  },

  async requestPasswordReset(identifier: string) {
    return apiRequest<PasswordResetRequestResponse>("/auth/request-password-reset", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ identifier }),
    });
  },

  async resetPassword(input: { identifier: string; otp: string; newPassword: string }) {
    await apiRequest<void>("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify(input),
    });
  },

  async changePassword(input: { currentPassword: string; newPassword: string }) {
    await apiRequest<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async clearSession() {
    await Promise.all([SecureStore.deleteItemAsync(USER_KEY), clearTokens()]);
  },
};

async function persistSession(session: AuthSession, rememberMe: boolean) {
  await setTokens(session.accessToken, session.refreshToken, rememberMe);

  if (rememberMe) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
  } else {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
}
