import { dprTaskTemplates } from '@/constants/dprTasks';
import type { BackendDprRecord, DprStatus, PlanningEvidenceFile } from '@/services/planning.service';
import type { DprItem } from '@/types/planning';
import type { EvidenceFile } from '@/types/evidence';
import { isEvidenceDirty } from '@/utils/evidenceSnapshot';
import { isEqualSnapshot } from '@/utils/isEqualSnapshot';

// Pure hydration logic for useDprForm, kept separate so it's testable
// without rendering a component or a query client.

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

// Identifies which DPR record a draft belongs to - (customer, date,
// supervisor), same uniqueness key the query itself is fetched by.
export function computeDprScopeKey(customerId: string | undefined, date: string | undefined, userId: string | undefined): string {
  return `${customerId ?? ''}::${date ?? ''}::${userId ?? ''}`;
}

// Hydration must happen exactly once per scope. A background refetch of the
// *same* scope changes the query data's reference but not `scopeKey`, so
// this returns false and in-progress edits are left untouched - only a
// genuine scope change (a different customer/date) returns true.
export function shouldHydrateDprDraft(hydratedFor: string | null, scopeKey: string, isLoading: boolean): boolean {
  return !isLoading && hydratedFor !== scopeKey;
}

export type DprDraftState = {
  items: DprItem[];
  remarks: string;
  evidence: EvidenceFile[];
};

// Builds the draft state for a scope from its existing server record, or a
// blank draft if there isn't one yet.
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

// Only plannedQty/completedQty/worker/delayReason are user-editable - `label`
// comes from the fixed dprTaskTemplates list, same reasoning as
// workPlanningDraft.ts's normalizeTasks.
type DprItemSnapshot = Record<string, { plannedQty: string; completedQty: string; worker: string; delayReason: string }>;

export function normalizeDprItems(items: DprItem[]): DprItemSnapshot {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      { plannedQty: item.plannedQty, completedQty: item.completedQty, worker: item.worker, delayReason: item.delayReason },
    ]),
  );
}

// Content dirtiness - deliberately separate from workflow-status concerns
// (see requiresDprWorkflowTransition below). Compares against the snapshot
// captured at hydration (or last successful submit), not "has any onChange
// fired" - a value changed then reverted reads as unchanged.
export function hasDprContentChanged(current: DprDraftState, baseline: DprDraftState): boolean {
  const itemsChanged = !isEqualSnapshot(normalizeDprItems(current.items), normalizeDprItems(baseline.items));
  const remarksChanged = current.remarks !== baseline.remarks;
  const evidenceChanged = isEvidenceDirty(current.evidence, baseline.evidence);
  return itemsChanged || remarksChanged || evidenceChanged;
}

// A DPR still in 'draft' (or with no record filed yet, i.e. undefined) has
// not actually reached the 'submitted' workflow state, so pressing Submit is
// a real transition even with zero content edits. Once a record is
// 'submitted' or 'approved', that transition has already happened - Submit
// on unchanged content would just be a pointless mutation (fake updatedAt /
// audit activity) rather than a meaningful workflow step.
export function requiresDprWorkflowTransition(status: DprStatus | undefined): boolean {
  return status !== 'submitted' && status !== 'approved';
}
