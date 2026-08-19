import { ApiError } from '@/services/apiClient';
import { normalizeError } from './normalizeError';

describe('normalizeError', () => {
  it('maps a network-level failure (status 0) to a connectivity message', () => {
    expect(normalizeError(new ApiError('Network request failed', 0))).toBe(
      'Unable to connect. Check your internet connection.',
    );
  });

  it('maps a timed-out request to a distinct message', () => {
    expect(normalizeError(new ApiError('Request timed out', 0))).toBe(
      'The request is taking too long. Try again.',
    );
  });

  it('maps 401 to a session-expired message', () => {
    expect(normalizeError(new ApiError('Unauthorized', 401))).toBe('Your session has expired. Please sign in again.');
  });

  it('maps 403 to a permission message', () => {
    expect(normalizeError(new ApiError('Forbidden', 403))).toBe("You don't have permission to perform this action.");
  });

  it('maps 404 to a not-found message', () => {
    expect(normalizeError(new ApiError('Not found', 404))).toBe('This record no longer exists.');
  });

  it('surfaces a short, safe 400/422 server message as-is', () => {
    expect(normalizeError(new ApiError('Amount must be greater than zero.', 400))).toBe('Amount must be greater than zero.');
    expect(normalizeError(new ApiError('Email is already in use.', 422))).toBe('Email is already in use.');
  });

  it('falls back to a generic validation message when the 400/422 message looks unsafe to show', () => {
    expect(normalizeError(new ApiError('ECONNREFUSED 500 stack trace: undefined', 400))).toBe(
      'Some information is invalid. Check the highlighted fields.',
    );
  });

  it('always uses the generic message for 5xx, regardless of the server message', () => {
    expect(normalizeError(new ApiError('Internal Server Error', 500), 'Unable to save')).toBe(
      'Something went wrong. Try again.',
    );
  });

  it('uses the caller-supplied fallback for an otherwise-unmapped status with an unsafe message', () => {
    expect(normalizeError(new ApiError('Something went wrong internally', 409), 'Unable to save the record')).toBe(
      'Unable to save the record',
    );
  });

  it('surfaces a safe message for an otherwise-unmapped status', () => {
    expect(normalizeError(new ApiError('This slot is already booked.', 409), 'Unable to save the record')).toBe(
      'This slot is already booked.',
    );
  });

  it('falls back to the caller-supplied fallback for a plain Error instance (not an ApiError)', () => {
    expect(normalizeError(new Error('boom'), 'Unable to do the thing')).toBe('Unable to do the thing');
  });

  it('falls back to the caller-supplied fallback for a string/unknown input', () => {
    expect(normalizeError('just a string', 'Unable to do the thing')).toBe('Unable to do the thing');
    expect(normalizeError(undefined, 'Unable to do the thing')).toBe('Unable to do the thing');
    expect(normalizeError(null, 'Unable to do the thing')).toBe('Unable to do the thing');
  });

  it('has a safe generic fallback when the caller supplies none', () => {
    expect(normalizeError('just a string')).toBe('Something went wrong. Try again.');
  });
});
