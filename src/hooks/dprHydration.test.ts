import {
  buildDprDraft,
  computeDprScopeKey,
  hasDprContentChanged,
  initialDprItems,
  requiresDprWorkflowTransition,
  shouldHydrateDprDraft,
  type DprDraftState,
} from './dprHydration';
import type { BackendDprRecord } from '@/services/planning.service';


function makeRecord(overrides: Partial<BackendDprRecord> = {}): BackendDprRecord {
  return {
    id: 'dpr-1',
    customerId: 'cust-1',
    projectId: 'proj-1',
    siteId: 'site-1',
    date: '2026-01-01',
    supervisorId: 'sup-1',
    status: 'submitted',
    remarks: 'All good',
    tasks: [
      { id: 'survey', plannedQty: '10', completedQty: '8', worker: 'Ramesh', delayReason: '' },
    ],
    evidence: [
      { id: 'ev-1', fileName: 'photo.jpg', fileUrl: 'https://cdn.example.com/photo.jpg', mimeType: 'image/jpeg' },
    ],
    submittedAt: '2026-01-01T10:00:00.000Z',
    supervisor: { id: 'sup-1', name: 'Amit' },
    site: { id: 'site-1', name: 'Site A', address: null },
    project: { id: 'proj-1', name: 'Project A' },
    customer: { id: 'cust-1', name: 'Rajesh Kumar', trBpNumber: 'BP-1' },
    ...overrides,
  };
}

describe('buildDprDraft', () => {
  it('initializes correctly from an existing DPR record', () => {
    const draft = buildDprDraft(makeRecord());

    expect(draft.remarks).toBe('All good');
    expect(draft.evidence).toEqual([
      expect.objectContaining({ id: 'ev-1', fileName: 'photo.jpg', fileUrl: 'https://cdn.example.com/photo.jpg' }),
    ]);
    const survey = draft.items.find((item) => item.id === 'survey');
    expect(survey).toMatchObject({ plannedQty: '10', completedQty: '8', worker: 'Ramesh' });
    expect(draft.items).toHaveLength(initialDprItems.length);
    const untouched = draft.items.find((item) => item.id === 'gi');
    expect(untouched).toMatchObject({ plannedQty: '', completedQty: '', worker: '', delayReason: '' });
  });

  it('initializes a blank draft when there is no existing record', () => {
    const draft = buildDprDraft(undefined);

    expect(draft).toEqual({ items: initialDprItems, remarks: '', evidence: [] });
  });

  it('treats a null remarks/evidence server record the same as a blank one for those fields', () => {
    const draft = buildDprDraft(makeRecord({ remarks: null, evidence: null }));

    expect(draft.remarks).toBe('');
    expect(draft.evidence).toEqual([]);
  });
});

describe('shouldHydrateDprDraft', () => {
  const scopeKey = computeDprScopeKey('cust-1', '2026-01-01', 'sup-1');

  it('hydrates a fresh mount (no scope hydrated yet)', () => {
    expect(shouldHydrateDprDraft(null, scopeKey, false)).toBe(true);
  });

  it('does not hydrate while the query is still loading', () => {
    expect(shouldHydrateDprDraft(null, scopeKey, true)).toBe(false);
  });

  it('does NOT re-hydrate on a background refetch of the same scope - the Phase A bug', () => {
    expect(shouldHydrateDprDraft(scopeKey, scopeKey, false)).toBe(false);
  });

  it('allows exactly one re-hydration when the scope genuinely changes', () => {
    const previousScope = computeDprScopeKey('cust-1', '2026-01-01', 'sup-1');
    const newScope = computeDprScopeKey('cust-2', '2026-01-02', 'sup-1');

    expect(shouldHydrateDprDraft(previousScope, newScope, false)).toBe(true);
    expect(shouldHydrateDprDraft(newScope, newScope, false)).toBe(false);
  });
});

describe('computeDprScopeKey', () => {
  it('produces a stable, distinct key per (customer, date, supervisor)', () => {
    const a = computeDprScopeKey('cust-1', '2026-01-01', 'sup-1');
    const b = computeDprScopeKey('cust-1', '2026-01-02', 'sup-1');
    const c = computeDprScopeKey('cust-2', '2026-01-01', 'sup-1');

    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(computeDprScopeKey('cust-1', '2026-01-01', 'sup-1')).toBe(a);
  });

  it('handles undefined segments without throwing', () => {
    expect(() => computeDprScopeKey(undefined, undefined, undefined)).not.toThrow();
  });
});


describe('hasDprContentChanged', () => {
  const baseline: DprDraftState = buildDprDraft(undefined);

  it('is false for an untouched draft compared against itself', () => {
    expect(hasDprContentChanged(baseline, baseline)).toBe(false);
  });

  it('is true when a task field changes', () => {
    const current: DprDraftState = {
      ...baseline,
      items: baseline.items.map((item) => (item.id === 'survey' ? { ...item, completedQty: '5' } : item)),
    };
    expect(hasDprContentChanged(current, baseline)).toBe(true);
  });

  it('is false again when a changed task field is reverted', () => {
    const edited: DprDraftState = {
      ...baseline,
      items: baseline.items.map((item) => (item.id === 'survey' ? { ...item, completedQty: '5' } : item)),
    };
    const reverted: DprDraftState = {
      ...edited,
      items: edited.items.map((item) => (item.id === 'survey' ? { ...item, completedQty: '' } : item)),
    };
    expect(hasDprContentChanged(reverted, baseline)).toBe(false);
  });

  it('is true when remarks change', () => {
    expect(hasDprContentChanged({ ...baseline, remarks: 'Delayed due to rain' }, baseline)).toBe(true);
  });

  it('is true when evidence is added, and false again once removed back to baseline', () => {
    const withEvidence: DprDraftState = {
      ...baseline,
      evidence: [{ id: 'new', fileName: 'photo.jpg', uri: 'file:///local/photo.jpg', status: 'Pending' }],
    };
    expect(hasDprContentChanged(withEvidence, baseline)).toBe(true);

    const removedAgain: DprDraftState = { ...withEvidence, evidence: [] };
    expect(hasDprContentChanged(removedAgain, baseline)).toBe(false);
  });
});

describe('requiresDprWorkflowTransition', () => {
  it('is true when there is no filed record yet', () => {
    expect(requiresDprWorkflowTransition(undefined)).toBe(true);
  });

  it('is true for a draft record - Submit is itself the transition', () => {
    expect(requiresDprWorkflowTransition('draft')).toBe(true);
  });

  it('is false once already submitted - nothing left to transition to on unchanged content', () => {
    expect(requiresDprWorkflowTransition('submitted')).toBe(false);
  });

  it('is false once approved', () => {
    expect(requiresDprWorkflowTransition('approved')).toBe(false);
  });
});

describe('canSubmit (hasContentChanges || requiresWorkflowTransition)', () => {
  const baseline: DprDraftState = buildDprDraft(undefined);

  it('an unchanged draft can still submit - the draft -> submitted transition is the point', () => {
    const canSubmit = hasDprContentChanged(baseline, baseline) || requiresDprWorkflowTransition('draft');
    expect(canSubmit).toBe(true);
  });

  it('an unchanged already-submitted record cannot submit again - would be a pointless mutation', () => {
    const canSubmit = hasDprContentChanged(baseline, baseline) || requiresDprWorkflowTransition('submitted');
    expect(canSubmit).toBe(false);
  });

  it('a changed already-submitted record can still submit', () => {
    const edited: DprDraftState = { ...baseline, remarks: 'Correction' };
    const canSubmit = hasDprContentChanged(edited, baseline) || requiresDprWorkflowTransition('submitted');
    expect(canSubmit).toBe(true);
  });

  it('a changed approved record can still submit (resubmit / correction)', () => {
    const edited: DprDraftState = { ...baseline, remarks: 'Correction after approval' };
    const canSubmit = hasDprContentChanged(edited, baseline) || requiresDprWorkflowTransition('approved');
    expect(canSubmit).toBe(true);
  });
});
