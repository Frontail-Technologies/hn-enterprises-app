import { matchesRelativeDateFilter } from './dateFilters';

// `matchesRelativeDateFilter` compares *local* calendar days. To make this
// suite deterministic without depending on (or forcing) the host machine's
// timezone, every fixture is built via the multi-arg `Date` constructor
// (which takes local y/m/d/h/... components) and then round-tripped through
// `toISOString()`. That round trip preserves the exact instant, so parsing
// it back with `new Date(iso)` and reading local calendar fields always
// recovers the same local date/time this test authored it with - on any
// host, in any timezone. A bare "YYYY-MM-DD" string would NOT have this
// property (it's parsed as UTC midnight, which can land on the previous or
// next local calendar day depending on the host's offset), so none are used
// here.
function localIso(year: number, month0: number, day: number, hour = 0, minute = 0, second = 0, ms = 0): string {
  return new Date(year, month0, day, hour, minute, second, ms).toISOString();
}

// "Now" pinned to local noon on 2026-03-15 (March = month index 2) -
// comfortably inside the day, away from any midnight boundary, so only the
// *value* under test controls which boundary is being exercised.
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
    // Same local day as "now", but at very different clock times.
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15, 0, 0, 0, 0), 'Today')).toBe(true);
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15, 23, 59, 59, 999), 'Today')).toBe(true);
    // The instant just after midnight into the next local day no longer counts,
    // even though it's only a millisecond past the previous instant.
    expect(matchesRelativeDateFilter(localIso(2026, 2, 16, 0, 0, 0, 0), 'Today')).toBe(false);
  });

  it('"Last 7 Days" includes today and exactly the 6 days before it', () => {
    expect(matchesRelativeDateFilter(localIso(2026, 2, 15), 'Last 7 Days')).toBe(true); // today
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
