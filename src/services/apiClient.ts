import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3005/api";
const REQUEST_TIMEOUT_MS = 12000;

const ACCESS_TOKEN_KEY = "hn_access_token";
const REFRESH_TOKEN_KEY = "hn_refresh_token";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  skipRefresh?: boolean;
  timeoutMs?: number;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

let refreshPromise: Promise<boolean> | null = null;

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, skipRefresh = false, timeoutMs, headers, ...requestOptions } =
    options;
  const token = auth ? await getAccessToken() : null;
  // FormData bodies must not get a manual Content-Type - the runtime sets the
  // multipart boundary itself. Only default to JSON for plain/string bodies.
  const isFormData = typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

  const response = await requestWithTimeout(
    `${API_BASE_URL}${path}`,
    {
      ...requestOptions,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    },
    timeoutMs,
  );

  if (response.status === 401 && auth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  return parseResponse<T>(response);
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function performRefreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await requestWithTimeout(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    const data = await parseResponse<{
      accessToken: string;
      refreshToken: string;
    }>(response);

    if (!data.accessToken || !data.refreshToken) return false;
    await setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    await clearTokens();
    return false;
  }
}

async function requestWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Server connection timed out", 0);
    }

    throw new ApiError("Unable to connect to server", 0);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message ?? "Something went wrong",
      response.status,
      payload?.errors,
    );
  }

  return payload?.data as T;
}
