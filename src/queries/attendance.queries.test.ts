import type { QueryClient } from '@tanstack/react-query';

import { isAttendanceQueryEnabled } from '@/context/attendanceGating';
import { createTestQueryClient } from '@/testUtils/queryClient';
import { applyAttendanceMutationResult } from './attendance.queries';
import { queryKeys } from './keys';
import type { BackendAttendanceRecord } from '@/services/attendance.service';

// Uses a real QueryClient (no React rendering, no fake react-query) so these
// tests exercise the actual cache-sync logic the app runs, not a
// reimplementation of it.

const clients: QueryClient[] = [];
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
});

describe('isAttendanceQueryEnabled', () => {
  it('is disabled while auth is still loading', () => {
    expect(isAttendanceQueryEnabled(true, 'user-1')).toBe(false);
  });

  it('is disabled with no authenticated user', () => {
    expect(isAttendanceQueryEnabled(false, null)).toBe(false);
  });

  it('is enabled once auth has resolved with a user', () => {
    expect(isAttendanceQueryEnabled(false, 'user-1')).toBe(true);
  });

  it('stays disabled if both auth is loading and there is no user yet', () => {
    expect(isAttendanceQueryEnabled(true, null)).toBe(false);
  });
});

function makeRecord(overrides: Partial<BackendAttendanceRecord> = {}): BackendAttendanceRecord {
  return {
    id: 'att-1',
    userId: 'user-1',
    date: '2026-03-15',
    status: 'present',
    checkInAt: '2026-03-15T09:00:00.000Z',
    checkOutAt: null,
    checkInLocation: null,
    checkOutLocation: null,
    remarks: null,
    markedBy: null,
    ...overrides,
  };
}

describe('applyAttendanceMutationResult (shared by check-in and check-out)', () => {
  function setup() {
    const queryClient = createTestQueryClient();
    clients.push(queryClient);
    // Seed a stale month cache entry the way the app would have it after an
    // earlier fetch, so we can observe it actually gets invalidated.
    queryClient.setQueryData(queryKeys.attendance.month('2026-03'), []);
    return queryClient;
  }

  it('writes the record into the current day cache (Check In)', () => {
    const queryClient = setup();
    const record = makeRecord({ checkInAt: '2026-03-15T09:00:00.000Z', checkOutAt: null });

    applyAttendanceMutationResult(queryClient, record);

    expect(queryClient.getQueryData(queryKeys.attendance.day('2026-03-15'))).toEqual(record);
  });

  it('invalidates the record’s month cache so History refetches', () => {
    const queryClient = setup();
    const record = makeRecord();

    applyAttendanceMutationResult(queryClient, record);

    const state = queryClient.getQueryState(queryKeys.attendance.month('2026-03'));
    expect(state?.isInvalidated).toBe(true);
  });

  it('does not invalidate an unrelated month', () => {
    const queryClient = setup();
    queryClient.setQueryData(queryKeys.attendance.month('2026-02'), []);
    const record = makeRecord();

    applyAttendanceMutationResult(queryClient, record);

    const unrelated = queryClient.getQueryState(queryKeys.attendance.month('2026-02'));
    expect(unrelated?.isInvalidated).toBe(false);
  });

  it('Check Out behaves equivalently to Check In - same day/month sync from the returned record', () => {
    const queryClient = setup();
    const checkedOut = makeRecord({ checkInAt: '2026-03-15T09:00:00.000Z', checkOutAt: '2026-03-15T17:00:00.000Z' });

    applyAttendanceMutationResult(queryClient, checkedOut);

    expect(queryClient.getQueryData(queryKeys.attendance.day('2026-03-15'))).toEqual(checkedOut);
    expect(queryClient.getQueryState(queryKeys.attendance.month('2026-03'))?.isInvalidated).toBe(true);
  });

  it('keys off the record’s own date, not any caller-supplied date', () => {
    // Guards against a regression where a caller passes a request date that
    // doesn't match what the server actually recorded (e.g. a late-night
    // check-in crossing midnight) - the cache must follow the server's answer.
    const queryClient = setup();
    queryClient.setQueryData(queryKeys.attendance.month('2026-04'), []);
    const record = makeRecord({ date: '2026-04-01' });

    applyAttendanceMutationResult(queryClient, record);

    expect(queryClient.getQueryData(queryKeys.attendance.day('2026-04-01'))).toEqual(record);
    expect(queryClient.getQueryState(queryKeys.attendance.month('2026-04'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(queryKeys.attendance.month('2026-03'))?.isInvalidated).toBe(false);
  });
});
