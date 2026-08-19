import { dedupeById } from './dedupeById';

describe('dedupeById', () => {
  it('keeps every item when ids are unique', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(dedupeById(items)).toEqual(items);
  });

  it('drops a later item that repeats an earlier id, keeping the first occurrence', () => {
    const first = { id: 'a', label: 'first' };
    const duplicate = { id: 'a', label: 'duplicate' };
    const result = dedupeById([first, duplicate, { id: 'b', label: 'b' }]);

    expect(result).toEqual([first, { id: 'b', label: 'b' }]);
  });

  it('page 1 + page 2 with no overlap produces no duplicates', () => {
    const page1 = [{ id: '1' }, { id: '2' }];
    const page2 = [{ id: '3' }, { id: '4' }];

    expect(dedupeById([...page1, ...page2])).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
  });

  it('an unstable sort tie-break repeating a row across a page boundary is collapsed to one', () => {
    // Simulates a backend page boundary handing back the same last-page-1/
    // first-page-2 row twice - the exact scenario this guards against.
    const page1 = [{ id: '1' }, { id: '2' }];
    const page2 = [{ id: '2' }, { id: '3' }];

    expect(dedupeById([...page1, ...page2])).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }]);
  });

  it('returns an empty array for an empty input', () => {
    expect(dedupeById([])).toEqual([]);
  });

  it('applies the same guarantee to Complaint-shaped records - useComplaintsScreen relies on this for its page 1/page 2 dedup', () => {
    const page1 = [
      { id: 'c-1', title: 'No gas pressure' },
      { id: 'c-2', title: 'Meter leak' },
    ];
    const page2 = [
      { id: 'c-2', title: 'Meter leak' },
      { id: 'c-3', title: 'Billing dispute' },
    ];

    expect(dedupeById([...page1, ...page2])).toEqual([
      { id: 'c-1', title: 'No gas pressure' },
      { id: 'c-2', title: 'Meter leak' },
      { id: 'c-3', title: 'Billing dispute' },
    ]);
  });
});
