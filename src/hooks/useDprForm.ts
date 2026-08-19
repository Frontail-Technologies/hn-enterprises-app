import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  buildDprDraft,
  computeDprScopeKey,
  hasDprContentChanged,
  initialDprItems,
  requiresDprWorkflowTransition,
  shouldHydrateDprDraft,
  type DprDraftState,
} from '@/hooks/dprHydration';
import { successHaptic } from '@/lib/haptics';
import { useDprRecordsQuery, useUpsertDprRecordMutation } from '@/queries';
import type { EvidenceFile } from '@/types/evidence';
import type { DprTaskPayload, PlanningEvidenceFile } from '@/services/planning.service';
import type { DprItem } from '@/types/planning';
import { normalizeError } from '@/utils/normalizeError';

function toPlanningEvidence(files: EvidenceFile[]): PlanningEvidenceFile[] {
  return files
    .filter((file) => Boolean(file.fileUrl))
    .map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl as string,
      mimeType: file.mimeType,
      capturedAt: file.capturedAt,
    }));
}

export function useDprForm() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { customerId, customerName, trBpNumber, projectId, siteId, siteName, date } = useLocalSearchParams<{
    customerId: string;
    customerName?: string;
    trBpNumber?: string;
    projectId: string;
    siteId: string;
    siteName?: string;
    date: string;
  }>();

  // Scoped to the acting supervisor: "my own filed DPR for this customer/date",
  // not just any supervisor's.
  const dprRecordsQuery = useDprRecordsQuery(
    { customerId, date, supervisorId: user?.id },
    { enabled: Boolean(customerId && date && user?.id) },
  );
  const upsertDprRecordMutation = useUpsertDprRecordMutation();

  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [evidenceLoadToken, setEvidenceLoadToken] = useState(0);
  const [items, setItems] = useState(initialDprItems);
  // The content-dirty comparison baseline - captured at hydration and reset
  // to the newly-saved state after a successful submit (see handleSubmit).
  const [baseline, setBaseline] = useState<DprDraftState>({ items: initialDprItems, remarks: '', evidence: [] });
  const submitting = upsertDprRecordMutation.isPending;

  // Seeded exactly once per scope, during render rather than in an effect
  // (React discards a render that sets state mid-render and re-renders
  // immediately, so there's no blank/unhydrated frame). The guard is what
  // stops a background refetch of the same scope (app foreground, reconnect)
  // from re-running and clobbering in-progress edits - only a genuine scope
  // change re-seeds.
  const scopeKey = computeDprScopeKey(customerId, date, user?.id);
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  if (shouldHydrateDprDraft(hydratedFor, scopeKey, dprRecordsQuery.isLoading)) {
    const draft = buildDprDraft(dprRecordsQuery.data?.[0]);
    setItems(draft.items);
    setRemarks(draft.remarks);
    setEvidence(draft.evidence);
    setBaseline(draft);
    setEvidenceLoadToken((token) => token + 1);
    setHydratedFor(scopeKey);
  }

  const existingStatus = dprRecordsQuery.data?.[0]?.status;
  // Two independent questions, not one `isDirty` - see useDprForm's audit:
  // unedited content can still need Submit (draft -> submitted is itself the
  // transition), and edited content can need Submit regardless of status.
  const hasContentChanges = hasDprContentChanged({ items, remarks, evidence }, baseline);
  const requiresWorkflowTransition = requiresDprWorkflowTransition(existingStatus);
  const canSubmit = hasContentChanges || requiresWorkflowTransition;

  const totalPlanned = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0),
    [items],
  );
  const totalCompleted = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.completedQty) || 0), 0),
    [items],
  );
  // Tasks with a completed qty actually entered, out of the fixed task list -
  // the "counts" shown next to the customer in the header, distinct from the
  // qty totals above (a task can be filled with qty 0, or left untouched).
  const tasksFilled = useMemo(() => items.filter((item) => item.completedQty !== '').length, [items]);

  const updateItem = (id: string, field: keyof DprItem, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleSubmit = async () => {
    // Defensive - the button is already disabled in this state, but a stale
    // press must still not reach the mutation, invalidate anything, or toast
    // a fake success.
    if (submitting || !canSubmit) return false;

    try {
      const tasks: DprTaskPayload[] = items.map((item) => ({
        id: item.id as DprTaskPayload['id'],
        plannedQty: item.plannedQty || undefined,
        completedQty: item.completedQty || undefined,
        worker: item.worker || undefined,
        delayReason: item.delayReason || undefined,
      }));

      const record = await upsertDprRecordMutation.mutateAsync({
        customerId,
        projectId,
        siteId,
        date,
        status: 'submitted',
        remarks: remarks || undefined,
        tasks,
        evidence: toPlanningEvidence(evidence),
      });
      setBaseline(buildDprDraft(record));
      successHaptic();
      showToast('DPR submitted', 'success');
      return true;
    } catch (error) {
      console.error('[useDprForm] submit failed', { customerId, date, error });
      showToast(normalizeError(error, 'Unable to submit DPR'), 'error');
      return false;
    }
  };

  return {
    date,
    customerName: customerName || 'Customer',
    trBpNumber: trBpNumber || '-',
    siteLabel: siteName || '-',
    // False only once the record for the current scope (customer/date) has
    // been applied to local state - lets the screen hold off rendering the
    // form until it knows whether to render it blank or pre-filled.
    isLoading: hydratedFor !== scopeKey,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    evidenceLoadToken,
    items,
    updateItem,
    totalPlanned,
    totalCompleted,
    tasksFilled,
    submitting,
    canSubmit,
    handleSubmit,
  };
}
