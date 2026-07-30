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

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const data = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password,
        clientType: "mobile",
      }),
    });

    await persistSession(data);
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
    await apiRequest<void>("/auth/request-password-reset", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ identifier }),
    });
  },

  async clearSession() {
    await Promise.all([SecureStore.deleteItemAsync(USER_KEY), clearTokens()]);
  },
};

async function persistSession(session: AuthSession) {
  await Promise.all([
    setTokens(session.accessToken, session.refreshToken),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
  ]);
}

