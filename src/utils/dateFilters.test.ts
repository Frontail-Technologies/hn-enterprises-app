import { matchesRelativeDateFilter } from './dateFilters';

function localIso(year: number, month0: number, day: number, hour = 0, minute = 0, second = 0, ms = 0): string {
  return new Date(year, month0, day, hour, minute, second, ms).toISOString();
}

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
});

afterAll(() => {
  jest.useRealTimers();
});

describe('matchesRelativeDateFilter', () => {
  it('"All" matches everything, even an invalid date', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15), 'All')).toBe(true);
    expect(matchesRelativeDateFilter('not-a-date', 'All')).toBe(true);
  });

  it('"Today" matches only the current local calendar day', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15), 'Today')).toBe(true);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 14), 'Today')).toBe(false);
  });

  it('"Today" is a local calendar-day boundary, not a rolling 24h window', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15, 0, 0, 0, 0), 'Today')).toBe(true);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15, 23, 59, 59, 999), 'Today')).toBe(true);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 16, 0, 0, 0, 0), 'Today')).toBe(false);
  });

  it('"Last 7 Days" includes today and exactly the 6 days before it', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15), 'Last 7 Days')).toBe(true);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 9), 'Last 7 Days')).toBe(true); // 6 days back - boundary
  });

  it('"Last 7 Days" excludes the 8th day back', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 8), 'Last 7 Days')).toBe(false);
  });

  it('excludes dates well outside the 7-day window', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 1), 'Last 7 Days')).toBe(false);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 1), 'Today')).toBe(false);
  });

  it('excludes a future date from both "Today" and "Last 7 Days"', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 16), 'Today')).toBe(false);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 16), 'Last 7 Days')).toBe(false);
  });

  it('treats an invalid date as not matching "Today" or "Last 7 Days"', () => {
    expect(matchesRelativeDateFilter('not-a-date', 'Today')).toBe(false);
    expect(matchesRelativeDateFilter('not-a-date', 'Last 7 Days')).toBe(false);
  });
});
