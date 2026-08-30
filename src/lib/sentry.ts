import * as Sentry from '@sentry/react-native';

import { ApiError } from '@/services/apiClient';

const EXPECTED_HTTP_STATUSES = new Set([0, 400, 401, 403, 404, 409, 422]);

const DEV_OPT_IN = process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV === 'true';
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

function resolveEnvironment(): string {
  if (__DEV__) return 'development';
  return process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || 'production';
}

export function initSentry() {
  if (!dsn) {
    if (!__DEV__) {
      console.warn('[sentry] EXPO_PUBLIC_SENTRY_DSN is not set; Sentry will not report events.');
    }
    return;
  }

  Sentry.init({
    dsn,
    enabled: !__DEV__ || DEV_OPT_IN,
    environment: resolveEnvironment(),
    debug: false,

    tracesSampleRate: 0,

    sendDefaultPii: false,

    beforeBreadcrumb: sanitizeBreadcrumb,
    beforeSend: sanitizeEvent,
  });
}

const SENSITIVE_HEADER_KEYS = ['authorization', 'cookie', 'set-cookie', 'x-refresh-token'];

function stripSensitiveHeaders(headers: unknown): unknown {
  if (!headers || typeof headers !== 'object') return headers;

  const cleaned: Record<string, unknown> = { ...(headers as Record<string, unknown>) };
  for (const key of Object.keys(cleaned)) {
    if (SENSITIVE_HEADER_KEYS.includes(key.toLowerCase())) {
      delete cleaned[key];
    }
  }
  return cleaned;
}

function sanitizeBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (breadcrumb.category === 'http' || breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
    if (breadcrumb.data) {
      const data = { ...breadcrumb.data } as Record<string, unknown>;
      delete data.request_body;
      delete data.response_body;
      delete data.body;
      if (data.headers) data.headers = stripSensitiveHeaders(data.headers);
      if (data.request_headers) data.request_headers = stripSensitiveHeaders(data.request_headers);
      if (data.response_headers) data.response_headers = stripSensitiveHeaders(data.response_headers);
      breadcrumb.data = data;
    }
  }

  return breadcrumb;
}

function sanitizeEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (event.request?.headers) {
    event.request.headers = stripSensitiveHeaders(event.request.headers) as Record<string, string>;
  }
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  return event;
}

export function captureUnexpectedError(error: unknown, context?: Record<string, string | number | boolean>) {
  if (error instanceof ApiError && EXPECTED_HTTP_STATUSES.has(error.status)) {
    return;
  }

  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function setSentryUser(user: { id: string; role?: string }) {
  Sentry.setUser({ id: user.id });
  if (user.role) Sentry.setTag('role', user.role);
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

const ID_LIKE_SEGMENT = /^[0-9a-f-]{8,}$/i;

function sanitizeRouteName(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (segment && ID_LIKE_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
}

export function addRouteBreadcrumb(pathname: string) {
  Sentry.addBreadcrumb({ category: 'navigation', message: sanitizeRouteName(pathname), level: 'info' });
}

export function addActionBreadcrumb(category: string, action: string, data?: Record<string, string | number | boolean>) {
  Sentry.addBreadcrumb({ category, message: action, level: 'info', data });
}

if (__DEV__) {
  (globalThis as Record<string, unknown>).__sentryTest = {
    throwJsError: () => {
      throw new Error('HN Enterprises Sentry JS test');
    },
    captureTestException: () => {
      Sentry.captureException(new Error('HN Enterprises Sentry manual capture test'));
    },
    nativeCrash: () => {
      Sentry.nativeCrash();
    },
  };
}
