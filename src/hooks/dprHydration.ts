import { dprTaskTemplates } from '@/constants/dprTasks';
import type { BackendDprRecord, DprStatus, PlanningEvidenceFile } from '@/services/planning.service';
import type { DprItem } from '@/types/planning';
import type { EvidenceFile } from '@/types/evidence';
import { isEvidenceDirty } from '@/utils/evidenceSnapshot';
import { isEqualSnapshot } from '@/utils/isEqualSnapshot';


export const initialDprItems: DprItem[] = dprTaskTemplates.map((task) => ({
  id: task.id,
  label: task.label,
  plannedQty: '',
  completedQty: '',
  worker: '',
  delayReason: '',
}));

export function fromPlanningEvidence(files: PlanningEvidenceFile[]): EvidenceFile[] {
  return files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    uri: file.fileUrl,
    mimeType: file.mimeType,
    capturedAt: file.capturedAt,
    status: 'Uploaded',
  }));
}

export function computeDprScopeKey(customerId: string | undefined, date: string | undefined, userId: string | undefined): string {
  return `${customerId ?? ''}::${date ?? ''}::${userId ?? ''}`;
}

export function shouldHydrateDprDraft(hydratedFor: string | null, scopeKey: string, isLoading: boolean): boolean {
  return !isLoading && hydratedFor !== scopeKey;
}

export type DprDraftState = {
  items: DprItem[];
  remarks: string;
  evidence: EvidenceFile[];
};

export function buildDprDraft(existing: BackendDprRecord | undefined): DprDraftState {
  if (!existing) {
    return { items: initialDprItems, remarks: '', evidence: [] };
  }

  return {
    items: dprTaskTemplates.map((task) => {
      const match = existing.tasks.find((item) => item.id === task.id);
      return {
        ...task,
        plannedQty: match?.plannedQty ?? '',
        completedQty: match?.completedQty ?? '',
        worker: match?.worker ?? '',
        delayReason: match?.delayReason ?? '',
      };
    }),
    remarks: existing.remarks ?? '',
    evidence: fromPlanningEvidence(existing.evidence ?? []),
  };
}

type DprItemSnapshot = Record<string, { plannedQty: string; completedQty: string; worker: string; delayReason: string }>;

export function normalizeDprItems(items: DprItem[]): DprItemSnapshot {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      { plannedQty: item.plannedQty, completedQty: item.completedQty, worker: item.worker, delayReason: item.delayReason },
    ]),
  );
}

export function hasDprContentChanged(current: DprDraftState, baseline: DprDraftState): boolean {
  const itemsChanged = !isEqualSnapshot(normalizeDprItems(current.items), normalizeDprItems(baseline.items));
  const remarksChanged = current.remarks !== baseline.remarks;
  const evidenceChanged = isEvidenceDirty(current.evidence, baseline.evidence);
  return itemsChanged || remarksChanged || evidenceChanged;
}

export function requiresDprWorkflowTransition(status: DprStatus | undefined): boolean {
  return status !== 'submitted' && status !== 'approved';
}
