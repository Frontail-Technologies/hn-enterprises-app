import * as Sentry from '@sentry/react-native';

import { ApiError } from '@/services/apiClient';

// Expected/business HTTP outcomes a caller might accidentally pass in - dropped defensively
// even though captureUnexpectedError's callers are expected to only reach for it on genuinely
// unexpected failures. Keeps this a safety net, not the primary filtering mechanism.
// 400/401/403/404/409/422 are normal API-level outcomes (validation, auth, not-found, conflict);
// 0 is this app's own apiClient.ts convention for network-unreachable/timeout ("Unable to
// connect to server" / "Server connection timed out") - both are expected, already-handled-by-
// toast conditions, never a bug to report.
const EXPECTED_HTTP_STATUSES = new Set([0, 400, 401, 403, 404, 409, 422]);

// Sentry is off by default in local development (no DSN needed to run the app, and everyday dev
// noise never reaches the shared project) unless a developer explicitly opts in while testing
// this integration itself.
const DEV_OPT_IN = process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV === 'true';
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

function resolveEnvironment(): string {
  if (__DEV__) return 'development';
  return process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT || 'production';
}

/**
 * Initializes Sentry. Call once, as early as possible (module scope in the root layout, not
 * inside a component) so startup crashes are still captured. Safe to call with no DSN set - the
 * SDK simply stays disabled.
 */
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

    // Crash/error monitoring only for this phase - performance tracing and Session Replay are
    // both off; neither is enabled by omitting their integrations/options below.
    tracesSampleRate: 0,

    // No IP address, no cookies, no default request/user PII - see beforeSend/beforeBreadcrumb
    // below for the additional defensive stripping on top of this.
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

// The SDK's automatic fetch/XHR breadcrumbs can include a `data` blob with headers and,
// depending on the request, a body - neither should ever reach Sentry given apiClient.ts sends
// bearer tokens via Authorization and request/response bodies can carry customer/business data.
// URLs/status codes (the useful part for debugging) are left untouched.
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

// Defense in depth on top of sendDefaultPii: false - strips anything that could still carry auth
// material if a future integration ever attaches request/response context to the event itself
// (not just breadcrumbs).
function sanitizeEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (event.request?.headers) {
    event.request.headers = stripSensitiveHeaders(event.request.headers) as Record<string, string>;
  }
  if (event.request?.cookies) {
    delete event.request.cookies;
  }

  return event;
}

/**
 * Reports a genuinely unexpected failure - a bug or infrastructure fault, not an expected
 * business/API outcome (wrong password, a validation error, offline, a 404, a cancelled picker,
 * etc. - those stay on the existing toast/error UX and never come here). Safe to call with any
 * unknown thrown value. `context` is for small, non-sensitive tags/extras only (a feature area, a
 * short reason) - never raw content (customer data, request/response bodies, file contents).
 */
export function captureUnexpectedError(error: unknown, context?: Record<string, string | number | boolean>) {
  if (error instanceof ApiError && EXPECTED_HTTP_STATUSES.has(error.status)) {
    return;
  }

  Sentry.captureException(error, context ? { extra: context } : undefined);
}

/**
 * Minimal, non-PII identity so a Sentry issue can be scoped to "how many users/which role are
 * affected," not who they are. Call from the single place a user becomes authenticated.
 */
export function setSentryUser(user: { id: string; role?: string }) {
  Sentry.setUser({ id: user.id });
  if (user.role) Sentry.setTag('role', user.role);
}

/** Call from the single centralized session-reset path (logout, confirmed-invalid session). */
export function clearSentryUser() {
  Sentry.setUser(null);
}

// A path segment that looks like a database ID (uuid, or a long run of hex/digits) rather than a
// route name - replaced before the path ever becomes a breadcrumb message, so a customer/work/
// attendance-day id is never recorded, only the route shape (e.g. "/customers/:id").
const ID_LIKE_SEGMENT = /^[0-9a-f-]{8,}$/i;

function sanitizeRouteName(pathname: string): string {
  return pathname
    .split('/')
    .map((segment) => (segment && ID_LIKE_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
}

/** Pass the raw resolved pathname (e.g. from expo-router's usePathname()) - any ID-shaped segment
 * is stripped before it becomes a breadcrumb, so this is safe to call directly. */
export function addRouteBreadcrumb(pathname: string) {
  Sentry.addBreadcrumb({ category: 'navigation', message: sanitizeRouteName(pathname), level: 'info' });
}

/** For a short, fixed set of low-risk user-action breadcrumbs - see call sites; never pass
 * anything derived from customer/business content (names, addresses, notes, remarks). */
export function addActionBreadcrumb(category: string, action: string, data?: Record<string, string | number | boolean>) {
  Sentry.addBreadcrumb({ category, message: action, level: 'info', data });
}

// Dev-only manual verification hooks - never wired to any UI, so there is no production
// "crash app" button. In a development build, trigger these from the JS debugger/Metro console:
//   __sentryTest.throwJsError()
//   __sentryTest.captureTestException()
//   __sentryTest.nativeCrash()   // destructive - terminates the app, call manually only
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
