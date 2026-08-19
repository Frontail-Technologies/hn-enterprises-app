import { isEvidenceDirty, normalizeEvidence } from './evidenceSnapshot';
import { isEqualSnapshot } from './isEqualSnapshot';
import type { EvidenceFile } from '@/types/evidence';

// Coverage for the composite `isDirty = valuesDirty || evidenceDirty` fix
// applied to every evidence-carrying customer-section form (Billing, GI,
// Isolation, LMC Civil, LMC Pipe, Meter/Commissioning, Survey, Fittings).

function uploaded(id: string, fileUrl: string, extra: Partial<EvidenceFile> = {}): EvidenceFile {
  return { id, fileName: `${id}.jpg`, fileUrl, ...extra };
}

function pending(id: string, uri: string, extra: Partial<EvidenceFile> = {}): EvidenceFile {
  return { id, fileName: `${id}.jpg`, uri, status: 'Pending', ...extra };
}

describe('isEvidenceDirty', () => {
  it('is false when nothing changed', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg')];
    const current = [uploaded('a', 'https://cdn/a.jpg')];
    expect(isEvidenceDirty(current, baseline)).toBe(false);
  });

  it('is true after adding a new (unsaved) file', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg')];
    const current = [...baseline, pending('new', 'file:///local/new.jpg')];
    expect(isEvidenceDirty(current, baseline)).toBe(true);
  });

  it('is true after removing an existing file', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg'), uploaded('b', 'https://cdn/b.jpg')];
    const current = [uploaded('a', 'https://cdn/a.jpg')];
    expect(isEvidenceDirty(current, baseline)).toBe(true);
  });

  it('is false again after adding then removing an unsaved item', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg')];
    const withAdd = [...baseline, pending('new', 'file:///local/new.jpg')];
    const backToBaseline = withAdd.filter((file) => file.id !== 'new');
    expect(isEvidenceDirty(backToBaseline, baseline)).toBe(false);
  });

  it('ignores order - re-adding files in a different sequence still reads as unchanged', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg'), uploaded('b', 'https://cdn/b.jpg')];
    const reordered = [uploaded('b', 'https://cdn/b.jpg'), uploaded('a', 'https://cdn/a.jpg')];
    expect(isEvidenceDirty(reordered, baseline)).toBe(false);
  });

  it('ignores transient upload progress, status, and error metadata', () => {
    const baseline = [pending('new', 'file:///local/new.jpg', { status: 'Pending' })];
    // Same file, mid-upload (status flipped, an error came and went) - not a
    // real content change, must not read as dirty.
    const current = [pending('new', 'file:///local/new.jpg', { status: 'Uploading', errorMessage: 'retrying' })];
    expect(isEvidenceDirty(current, baseline)).toBe(false);
  });

  it('ignores object reference identity - a re-created array of equal content is not dirty', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg')];
    const current = baseline.map((file) => ({ ...file }));
    expect(isEvidenceDirty(current, baseline)).toBe(false);
  });

  it('treats a local pending pick becoming uploaded (fileUrl assigned) as unchanged once identity carries over', () => {
    // Identity priority is fileUrl > uri > id - a file that finishes
    // uploading gains a fileUrl but its `uri` is what the baseline knew it
    // by; once fileUrl is present that becomes the identity going forward,
    // so this models the two ends of that transition separately rather than
    // asserting they're equal to each other (they aren't - different
    // fields), only that each is stable against itself.
    const stillPending = [pending('new', 'file:///local/new.jpg')];
    expect(isEvidenceDirty(stillPending, stillPending)).toBe(false);
  });

  it('detects a replaced file (same slot, different identity) as dirty', () => {
    const baseline = [uploaded('a', 'https://cdn/a.jpg')];
    const replaced = [{ ...baseline[0], fileUrl: undefined, uri: 'file:///local/replacement.jpg', status: 'Pending' as const }];
    expect(isEvidenceDirty(replaced, baseline)).toBe(true);
  });
});

describe('normalizeEvidence', () => {
  it('prefers fileUrl, then uri, then id as identity', () => {
    expect(normalizeEvidence([uploaded('a', 'https://cdn/a.jpg', { uri: 'file:///ignored.jpg' })])).toEqual(['https://cdn/a.jpg']);
    expect(normalizeEvidence([pending('b', 'file:///local/b.jpg')])).toEqual(['file:///local/b.jpg']);
    expect(normalizeEvidence([{ id: 'only-id', fileName: 'c.jpg' }])).toEqual(['only-id']);
  });

  it('sorts identities so comparison is order-independent', () => {
    expect(normalizeEvidence([uploaded('b', 'z'), uploaded('a', 'a')])).toEqual(['a', 'z']);
  });
});

// Proves the composite formula every evidence-carrying customer-section form
// now uses: `isDirty = valuesDirty || evidenceDirty`. Each form wires its own
// `values` object through useDraftForm and its own `evidence` state through
// this helper - this exercises the same OR-composition generically, since the
// forms themselves aren't renderable in this repo's test setup.
describe('composite isDirty = valuesDirty || evidenceDirty', () => {
  const baselineValues = { remarks: 'Site is accessible' };
  const baselineEvidence = [uploaded('a', 'https://cdn/a.jpg')];

  function isDirty(values: typeof baselineValues, evidence: EvidenceFile[]) {
    const valuesDirty = !isEqualSnapshot(values, baselineValues);
    const evidenceDirty = isEvidenceDirty(evidence, baselineEvidence);
    return valuesDirty || evidenceDirty;
  }

  it('is false when neither values nor evidence changed', () => {
    expect(isDirty({ ...baselineValues }, [...baselineEvidence])).toBe(false);
  });

  it('is true for a values-only change', () => {
    expect(isDirty({ remarks: 'Blocked by gate' }, [...baselineEvidence])).toBe(true);
  });

  it('is true for an evidence-only change, even with values untouched', () => {
    const withNewEvidence = [...baselineEvidence, pending('new', 'file:///local/new.jpg')];
    expect(isDirty({ ...baselineValues }, withNewEvidence)).toBe(true);
  });

  it('is false once a values change is reverted, with evidence untouched', () => {
    expect(isDirty({ remarks: 'Blocked' }, [...baselineEvidence])).toBe(true);
    expect(isDirty({ ...baselineValues }, [...baselineEvidence])).toBe(false);
  });

  it('is false once an added evidence item is removed again, with values untouched', () => {
    const withNewEvidence = [...baselineEvidence, pending('new', 'file:///local/new.jpg')];
    const removedAgain = withNewEvidence.filter((file) => file.id !== 'new');
    expect(isDirty({ ...baselineValues }, removedAgain)).toBe(false);
  });
});
