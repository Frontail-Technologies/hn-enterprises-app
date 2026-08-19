import type { EvidenceFile } from '@/types/evidence';
import { isEqualSnapshot } from '@/utils/isEqualSnapshot';

// Stable identity for one evidence file, in priority order:
//  - `fileUrl`: already uploaded/persisted - the authoritative, server-
//    assigned identity, stable across reloads.
//  - `uri`: a locally-picked file not yet uploaded. Its own `id` is NOT
//    used here - EvidenceUploader stamps pending picks with
//    `${...}-${Date.now()}-${index}`, so the same file removed and
//    re-added would get a different `id` even though it's the same photo;
//    `uri` (the actual local file path) is what's genuinely stable for an
//    unsaved pick.
//  - `id`: last-resort fallback, only reached if a file somehow has neither.
function evidenceIdentity(file: EvidenceFile): string {
  return file.fileUrl ?? file.uri ?? file.id;
}

// No evidence list across these forms has a reorder control - order carries
// no business meaning, so this sorts identities to keep the comparison
// order-independent (add-then-remove-in-a-different-order must still read
// as "back to baseline").
export function normalizeEvidence(files: EvidenceFile[]): string[] {
  return files.map(evidenceIdentity).filter(Boolean).sort();
}

// Shared by every evidence-carrying customer-section form's composite
// `isDirty = valuesDirty || evidenceDirty`. Deliberately ignores everything
// but identity - upload progress, `status`/`errorMessage`, and object
// reference are all transient/runtime, never a business change.
export function isEvidenceDirty(current: EvidenceFile[], baseline: EvidenceFile[]): boolean {
  return !isEqualSnapshot(normalizeEvidence(current), normalizeEvidence(baseline));
}
