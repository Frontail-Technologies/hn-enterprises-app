import { ApiError } from '@/services/apiClient';

const GENERIC = 'Something went wrong. Try again.';

function isUserFacing(message?: string) {
  if (!message) return false;
  const text = message.trim();
  if (!text || text.length > 160) return false;
  if (/something went wrong/i.test(text)) return false;
  if (/(stack|undefined|null|econn|timeout|timed out|fetch|axios|xhr|network request failed|\b[45]\d\d\b)/i.test(text)) {
    return false;
  }
  return true;
}

export function normalizeError(error: unknown, fallback: string = GENERIC): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return /timed out/i.test(error.message)
        ? 'The request is taking too long. Try again.'
        : 'Unable to connect. Check your internet connection.';
    }

    switch (error.status) {
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return 'This record no longer exists.';
      case 400:
      case 422:
        return isUserFacing(error.message)
          ? error.message
          : 'Some information is invalid. Check the highlighted fields.';
      default:
        if (error.status >= 500) return GENERIC;
        return isUserFacing(error.message) ? error.message : fallback;
    }
  }

  return fallback;
}
