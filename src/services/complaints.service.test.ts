import { buildComplaintsQuery, isOpenComplaint } from './complaints.service';
import type { ComplaintRecord } from './complaints.service';

// Protects Phase D.1's "Complaints must migrate to the existing backend
// pagination contract" fix: search/status/supervisor scope all have to
// actually land in the request, not stay a client-side-only filter.
describe('buildComplaintsQuery', () => {
  it('omits every param when nothing is filtered', () => {
    expect(buildComplaintsQuery({}).toString()).toBe('');
  });

  it('carries search and status through unchanged', () => {
    const query = buildComplaintsQuery({ search: 'leak', status: 'open' });
    expect(query.get('search')).toBe('leak');
    expect(query.get('status')).toBe('open');
  });

  it('preserves supervisor scope alongside search/status', () => {
    const query = buildComplaintsQuery({ search: 'leak', status: 'open', supervisorId: 'sup-1' });
    expect(query.get('supervisorId')).toBe('sup-1');
    expect(query.get('search')).toBe('leak');
    expect(query.get('status')).toBe('open');
  });
});

describe('isOpenComplaint', () => {
  function makeComplaint(status: ComplaintRecord['status']): ComplaintRecord {
    return {
      id: 'c-1',
      customerId: 'cust-1',
      customerName: 'Rajesh Kumar',
      title: 'No gas pressure',
      description: 'Low pressure at the meter',
      priority: 'high',
      status,
      supervisorRemark: '',
      createdAt: '2026-03-10T00:00:00.000Z',
    };
  }

  it('treats "open" and "in_progress" as open', () => {
    expect(isOpenComplaint(makeComplaint('open'))).toBe(true);
    expect(isOpenComplaint(makeComplaint('in_progress'))).toBe(true);
  });

  it('treats "resolved" and "closed" as not open', () => {
    expect(isOpenComplaint(makeComplaint('resolved'))).toBe(false);
    expect(isOpenComplaint(makeComplaint('closed'))).toBe(false);
  });
});
