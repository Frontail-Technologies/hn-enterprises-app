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
  meta?: { pagination?: PaginationMeta };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

let refreshPromise: Promise<boolean> | null = null;

// Tokens always live here for the current app session. Whether they ALSO get
// written to SecureStore (surviving an app restart) depends on "remember me" -
// tracked here so a later silent token refresh keeps honoring the choice made
// at login, without every setTokens() call needing to repeat it.
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let rememberSession = true;

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}

export async function getAccessToken() {
  if (memoryAccessToken !== null) return memoryAccessToken;
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  if (memoryRefreshToken !== null) return memoryRefreshToken;
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string, rememberMe = rememberSession) {
  rememberSession = rememberMe;
  memoryAccessToken = accessToken;
  memoryRefreshToken = refreshToken;

  if (rememberMe) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } else {
    await clearPersistedTokens();
  }
}

async function clearPersistedTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function clearTokens() {
  memoryAccessToken = null;
  memoryRefreshToken = null;
  rememberSession = true;
  await clearPersistedTokens();
}

async function performRequest(path: string, options: ApiRequestOptions): Promise<Response> {
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
        // Bypasses ngrok's free-tier browser-warning interstitial when the API is
        // tunneled during local dev (see mobile-app/.env) - ignored by the real backend.
        "ngrok-skip-browser-warning": "true",
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
      return performRequest(path, { ...options, skipRefresh: true });
    }
  }

  return response;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await performRequest(path, options);
  return parseResponse<T>(response);
}

// Same request/auth-retry path as apiRequest, but also surfaces meta.pagination
// instead of discarding it - needed by any list endpoint an infinite-scroll
// screen paginates through.
export async function apiRequestPaginated<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T; pagination?: PaginationMeta }> {
  const response = await performRequest(path, options);
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message ?? "Something went wrong", response.status, payload?.errors);
  }

  return { data: payload?.data as T, pagination: payload?.meta?.pagination };
}

// Expo's fetch (the default global `fetch` since SDK 53) can't send React
// Native's classic {uri,name,type} FormData file part - it throws
// "Unsupported FormDataPart implementation". XMLHttpRequest uses RN's native
// networking bridge instead, which streams `uri` parts from disk directly and
// has supported this shape for years - so any FormData body with an embedded
// file must go through here, not through apiRequest()/fetch().
export async function apiRequestFormData<T>(
  path: string,
  formData: FormData,
  options: {
    method?: string;
    auth?: boolean;
    timeoutMs?: number;
    skipRefresh?: boolean;
    onProgress?: (fraction: number) => void;
  } = {},
): Promise<T> {
  const { method = "POST", auth = true, timeoutMs = REQUEST_TIMEOUT_MS, skipRefresh = false, onProgress } = options;
  const token = auth ? await getAccessToken() : null;

  const { status, payload } = await sendFormDataViaXhr(`${API_BASE_URL}${path}`, formData, method, token, timeoutMs, onProgress);

  if (status === 401 && auth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequestFormData<T>(path, formData, { ...options, skipRefresh: true });
    }
  }

  if (status < 200 || status >= 300 || payload?.success === false) {
    throw new ApiError(payload?.message ?? "Something went wrong", status, payload?.errors);
  }

  return payload?.data as T;
}

function sendFormDataViaXhr(
  url: string,
  formData: FormData,
  method: string,
  token: string | null,
  timeoutMs: number,
  onProgress?: (fraction: number) => void,
): Promise<{ status: number; payload: ApiResponse<unknown> | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = timeoutMs;
    xhr.open(method, url);
    xhr.setRequestHeader("Accept", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
    }

    xhr.onload = () => {
      let payload: ApiResponse<unknown> | null = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        payload = null;
      }
      resolve({ status: xhr.status, payload });
    };

    xhr.onerror = () => {
      console.error("[apiClient] xhr formdata request failed", { url, method });
      reject(new ApiError("Unable to connect to server", 0));
    };
    xhr.ontimeout = () => reject(new ApiError("Server connection timed out", 0));

    xhr.send(formData);
  });
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

    // "Unable to connect to server" is a catch-all label - log what fetch
    // actually threw, since this also fires for local failures (e.g. reading
    // a bad file:// / content:// uri for a multipart body), not just genuine
    // network unreachability.
    console.error("[apiClient] fetch threw", {
      url,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      error,
    });
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
