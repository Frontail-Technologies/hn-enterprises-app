import type { EvidenceFile } from '@/types/evidence';
import { isEqualSnapshot } from '@/utils/isEqualSnapshot';

function evidenceIdentity(file: EvidenceFile): string {
  return file.fileUrl ?? file.uri ?? file.id;
}

export function normalizeEvidence(files: EvidenceFile[]): string[] {
  return files.map(evidenceIdentity).filter(Boolean).sort();
}

export function isEvidenceDirty(current: EvidenceFile[], baseline: EvidenceFile[]): boolean {
  return !isEqualSnapshot(normalizeEvidence(current), normalizeEvidence(baseline));
}
