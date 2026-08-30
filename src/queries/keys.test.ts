import { queryKeys } from './keys';


function startsWith(key: readonly unknown[], prefix: readonly unknown[]) {
  return prefix.every((segment, index) => key[index] === segment);
}

describe('customers keys', () => {
  it('list/options/infiniteList share the expected Customer list/options prefixes', () => {
    expect(startsWith(queryKeys.customers.list('john'), queryKeys.customers.allLists)).toBe(true);
    expect(startsWith(queryKeys.customers.list(), queryKeys.customers.allLists)).toBe(true);
    expect(startsWith(queryKeys.customers.infiniteList('john'), queryKeys.customers.allLists)).toBe(true);
    expect(startsWith(queryKeys.customers.options('john'), queryKeys.customers.allOptions)).toBe(true);
  });

  it('detail and notes fall under the broad Customer prefix, but not under allLists/allOptions', () => {
    expect(startsWith(queryKeys.customers.detail('c-1'), queryKeys.customers.all)).toBe(true);
    expect(startsWith(queryKeys.customers.notes('c-1'), queryKeys.customers.all)).toBe(true);
    expect(startsWith(queryKeys.customers.detail('c-1'), queryKeys.customers.allLists)).toBe(false);
    expect(startsWith(queryKeys.customers.detail('c-1'), queryKeys.customers.allOptions)).toBe(false);
  });
});

describe('work keys', () => {
  it('history and queue fall under the Work prefix', () => {
    expect(startsWith(queryKeys.work.history('c-1'), queryKeys.work.all)).toBe(true);
    expect(startsWith(queryKeys.work.queue({ search: 'BP123' }), queryKeys.work.all)).toBe(true);
  });

  it('a changed search or status term produces a distinct queue key - a stale response for one filter can never resolve into another', () => {
    const base = queryKeys.work.queue({ search: 'BP123', status: undefined });
    const changedSearch = queryKeys.work.queue({ search: 'BP456', status: undefined });
    const changedStatus = queryKeys.work.queue({ search: 'BP123', status: 'in_progress' });

    expect(base).not.toEqual(changedSearch);
    expect(base).not.toEqual(changedStatus);
  });

  it('the same search/status params produce an equal (cache-hit) key', () => {
    expect(queryKeys.work.queue({ search: 'BP123' })).toEqual(queryKeys.work.queue({ search: 'BP123' }));
  });

  it('project/site/stage each produce a distinct queue key too - not just search/status', () => {
    const base = queryKeys.work.queue({});
    expect(base).not.toEqual(queryKeys.work.queue({ projectId: 'proj-1' }));
    expect(base).not.toEqual(queryKeys.work.queue({ siteId: 'site-1' }));
    expect(base).not.toEqual(queryKeys.work.queue({ stage: 'GC' }));
  });

  it('queueSummary falls under the Work prefix but is a separate cache entry from the paginated queue, even with identical params', () => {
    const params = { search: 'BP123', status: 'in_progress' };
    expect(startsWith(queryKeys.work.queueSummary(params), queryKeys.work.all)).toBe(true);
    expect(queryKeys.work.queueSummary(params)).not.toEqual(queryKeys.work.queue(params));
  });
});

describe('expenses keys', () => {
  it('infiniteList falls under the Expenses prefix, so a create/update mutation invalidating expenses.all covers it', () => {
    expect(startsWith(queryKeys.expenses.infiniteList({ search: 'cement' }), queryKeys.expenses.all)).toBe(true);
  });

  it('a changed filter (search, category, or date range) produces a distinct list key', () => {
    const base = queryKeys.expenses.infiniteList({ search: 'cement' });
    const changedSearch = queryKeys.expenses.infiniteList({ search: 'sand' });
    const changedCategory = queryKeys.expenses.infiniteList({ search: 'cement', category: 'material_expense' });
    const changedRange = queryKeys.expenses.infiniteList({ search: 'cement', from: '2026-01-01' });

    expect(base).not.toEqual(changedSearch);
    expect(base).not.toEqual(changedCategory);
    expect(base).not.toEqual(changedRange);
  });

  it('summary is a separate cache entry from infiniteList, even with identical params - Overview must never share a cache slot with the paginated list', () => {
    const params = { search: 'cement', category: 'material_expense' };
    expect(startsWith(queryKeys.expenses.summary(params), queryKeys.expenses.all)).toBe(true);
    expect(queryKeys.expenses.summary(params)).not.toEqual(queryKeys.expenses.infiniteList(params));
  });

  it('summary scoped to search/date only differs from summary scoped to the full filter set - Overview and the list total are independent aggregates', () => {
    const overviewScope = queryKeys.expenses.summary({ search: 'cement' });
    const listScope = queryKeys.expenses.summary({ search: 'cement', category: 'material_expense' });
    expect(overviewScope).not.toEqual(listScope);
  });
});

describe('complaints keys', () => {
  it('infiniteList falls under the Complaints prefix, so a create/update mutation invalidating complaints.all covers it', () => {
    expect(startsWith(queryKeys.complaints.infiniteList({ search: 'leak' }), queryKeys.complaints.all)).toBe(true);
  });

  it('a changed search or status term produces a distinct list key', () => {
    const base = queryKeys.complaints.infiniteList({ search: 'leak', status: undefined });
    const changedSearch = queryKeys.complaints.infiniteList({ search: 'gas', status: undefined });
    const changedStatus = queryKeys.complaints.infiniteList({ search: 'leak', status: 'resolved' });

    expect(base).not.toEqual(changedSearch);
    expect(base).not.toEqual(changedStatus);
  });

  it('the same params produce an equal (cache-hit) key', () => {
    expect(queryKeys.complaints.infiniteList({ search: 'leak' })).toEqual(
      queryKeys.complaints.infiniteList({ search: 'leak' }),
    );
  });
});

describe('attendance keys', () => {
  it('month falls under both the broad Attendance prefix and the month-specific prefix', () => {
    expect(startsWith(queryKeys.attendance.month('2026-03'), queryKeys.attendance.all)).toBe(true);
    expect(startsWith(queryKeys.attendance.month('2026-03'), queryKeys.attendance.allMonths)).toBe(true);
  });

  it('day falls under the broad Attendance prefix but not the month-specific one', () => {
    expect(startsWith(queryKeys.attendance.day('2026-03-15'), queryKeys.attendance.all)).toBe(true);
    expect(startsWith(queryKeys.attendance.day('2026-03-15'), queryKeys.attendance.allMonths)).toBe(false);
  });
});

describe('stats keys', () => {
  it('summary and details fall under the Stats prefix', () => {
    expect(startsWith(queryKeys.stats.summary, queryKeys.stats.all)).toBe(true);
    expect(startsWith(queryKeys.stats.details('work'), queryKeys.stats.all)).toBe(true);
    expect(startsWith(queryKeys.stats.detailsInfinite('work'), queryKeys.stats.all)).toBe(true);
  });
});

describe('masters keys', () => {
  it('uses the canonical factory rather than ad hoc literals', () => {
    expect(startsWith(queryKeys.masters.values('Payment Types'), queryKeys.masters.all)).toBe(true);
    expect(startsWith(queryKeys.masters.customFields, queryKeys.masters.all)).toBe(true);
  });
});

describe('projects.sites', () => {
  it('uses the corrected segment order - fixed label before the variable id, like every sibling key', () => {
    expect(queryKeys.projects.sites('proj-1')).toEqual(['projects', 'sites', 'proj-1']);
  });
});

describe('plumbers keys', () => {
  it('options is a canonical key, not an ad hoc spread extension', () => {
    expect(startsWith(queryKeys.plumbers.options, queryKeys.plumbers.all)).toBe(true);
  });
});
