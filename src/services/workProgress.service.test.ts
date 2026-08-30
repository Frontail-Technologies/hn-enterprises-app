import {
  STAGE_TO_MOBILE,
  STATUS_TO_MOBILE,
  adaptCustomerForWorkDetail,
  buildDetailRecord,
  buildWorkQueueQuery,
  isSentBack,
  type BackendWorkProgressUpdate,
} from './workProgress.service';
import type { CustomerRecord } from '../types/customers';


describe('STAGE_TO_MOBILE', () => {
  it('maps every backend stage to its mobile label', () => {
    expect(STAGE_TO_MOBILE).toEqual({
      survey: 'Survey',
      workable: 'Workable',
      plumbing_gi: 'Plumbing / GI',
      gc: 'GC',
      commissioning: 'Commissioning',
      conversion: 'Conversion',
    });
  });
});

describe('STATUS_TO_MOBILE', () => {
  it('maps every backend status to its mobile label', () => {
    expect(STATUS_TO_MOBILE).toEqual({
      not_started: 'Not Started',
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      sent_back: 'Sent Back',
      on_hold: 'On Hold',
    });
  });
});

describe('isSentBack', () => {
  it('is true only for the "Sent Back" status', () => {
    expect(isSentBack('Sent Back')).toBe(true);
    expect(isSentBack('Pending')).toBe(false);
    expect(isSentBack('Completed')).toBe(false);
    expect(isSentBack('Not Started')).toBe(false);
  });
});

describe('adaptCustomerForWorkDetail', () => {
  it('pulls exactly the fields buildDetailRecord needs out of a full CustomerRecord', () => {
    const customer = {
      id: 'cust-1',
      siteArea: 'Shyam Nagar Block A',
      customerConnection: {
        customerName: 'Rajesh Kumar',
        mobileNo: '9876543210',
        trBpNo: 'BP-100245',
        supervisorName: 'Amit Rathore',
      },
    } as unknown as CustomerRecord;

    expect(adaptCustomerForWorkDetail(customer)).toEqual({
      id: 'cust-1',
      customerName: 'Rajesh Kumar',
      mobileNumber: '9876543210',
      bpTrNumber: 'BP-100245',
      siteArea: 'Shyam Nagar Block A',
      supervisor: 'Amit Rathore',
    });
  });
});

describe('buildDetailRecord', () => {
  const customer = {
    id: 'cust-1',
    customerName: 'Rajesh Kumar',
    mobileNumber: '9876543210',
    bpTrNumber: 'BP-100245',
    siteArea: 'Shyam Nagar Block A',
    supervisor: 'Amit Rathore',
  };

  function makeUpdate(overrides: Partial<BackendWorkProgressUpdate> = {}): BackendWorkProgressUpdate {
    return {
      id: 'update-1',
      customerId: 'cust-1',
      customer: { id: 'cust-1', name: 'Rajesh Kumar', trBpNumber: 'BP-100245', mobileNumber: '9876543210' },
      project: { id: 'proj-1', name: 'Shyam Nagar CGD Project' },
      site: { id: 'site-1', name: 'Shyam Nagar Block A' },
      stage: 'plumbing_gi',
      status: 'in_progress',
      nextRequiredAction: 'Schedule conversion visit',
      remarks: null,
      evidence: [],
      createdAt: '2026-03-10T00:00:00.000Z',
      supervisor: { id: 'sup-1', name: 'Amit Rathore' },
      ...overrides,
    };
  }

  it('falls back to Survey / Not Started with no history yet', () => {
    const record = buildDetailRecord(customer, undefined);

    expect(record.currentStage).toBe('Survey');
    expect(record.expectedNextStage).toBe('Workable');
    expect(record.status).toBe('Not Started');
    expect(record.customerName).toBe('Rajesh Kumar');
  });

  it('maps the latest update through the same backend-stage/status labels as the rest of the app', () => {
    const record = buildDetailRecord(customer, makeUpdate());

    expect(record.currentStage).toBe(STAGE_TO_MOBILE.plumbing_gi);
    expect(record.status).toBe(STATUS_TO_MOBILE.in_progress);
    expect(record.expectedNextStage).toBe('GC');
  });

  it('reports "Sent Back" consistently with isSentBack', () => {
    const record = buildDetailRecord(customer, makeUpdate({ status: 'sent_back' }));

    expect(record.status).toBe('Sent Back');
    expect(isSentBack(record.status)).toBe(true);
  });

  it('prefers the latest update’s project/site/supervisor over the customer’s own, but falls back to the customer’s when absent', () => {
    const withSite = buildDetailRecord(customer, makeUpdate());
    expect(withSite.siteArea).toBe('Shyam Nagar Block A');
    expect(withSite.supervisor).toBe('Amit Rathore');

    const withoutSite = buildDetailRecord(customer, makeUpdate({ site: null, supervisor: null }));
    expect(withoutSite.siteArea).toBe(customer.siteArea);
    expect(withoutSite.supervisor).toBe(customer.supervisor);
  });
});

describe('buildWorkQueueQuery', () => {
  it('omits every param when nothing is filtered', () => {
    expect(buildWorkQueueQuery({}).toString()).toBe('');
  });

  it('sends the project and site ids straight through, not their display names', () => {
    const query = buildWorkQueueQuery({ projectId: 'proj-1', siteId: 'site-1' });
    expect(query.get('projectId')).toBe('proj-1');
    expect(query.get('siteId')).toBe('site-1');
  });

  it('maps stage and status through the same backend enum used everywhere else', () => {
    const query = buildWorkQueueQuery({ stage: 'Plumbing / GI', status: 'Sent Back' });
    expect(query.get('stage')).toBe('plumbing_gi');
    expect(query.get('status')).toBe('sent_back');
  });

  it('carries search through unchanged', () => {
    expect(buildWorkQueueQuery({ search: 'BP12345' }).get('search')).toBe('BP12345');
  });

  it('combines every active filter into one request', () => {
    const query = buildWorkQueueQuery({
      search: 'Rajesh',
      status: 'In Progress',
      projectId: 'proj-1',
      siteId: 'site-1',
      stage: 'GC',
    });
    expect(query.get('search')).toBe('Rajesh');
    expect(query.get('status')).toBe('in_progress');
    expect(query.get('projectId')).toBe('proj-1');
    expect(query.get('siteId')).toBe('site-1');
    expect(query.get('stage')).toBe('gc');
  });
});
