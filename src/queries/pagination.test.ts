import { nextPageParam } from './pagination';

describe('nextPageParam', () => {
  it('returns the next page number when more pages remain', () => {
    expect(nextPageParam({ page: 1, limit: 100, total: 250, totalPages: 3 })).toBe(2);
    expect(nextPageParam({ page: 2, limit: 100, total: 250, totalPages: 3 })).toBe(3);
  });

  it('returns undefined once the final page has loaded (hasNextPage becomes false)', () => {
    expect(nextPageParam({ page: 3, limit: 100, total: 250, totalPages: 3 })).toBeUndefined();
  });

  it('returns undefined for a single-page result set', () => {
    expect(nextPageParam({ page: 1, limit: 100, total: 40, totalPages: 1 })).toBeUndefined();
  });

  it('returns undefined for an empty result set', () => {
    expect(nextPageParam({ page: 1, limit: 100, total: 0, totalPages: 1 })).toBeUndefined();
  });
});
