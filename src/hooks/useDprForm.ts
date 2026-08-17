import { useEffect, useMemo, useState } from 'react';

import { dprTaskTemplates } from '@/constants/dprTasks';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useCustomerOptionsQuery, useDprRecordsQuery, useUpsertDprRecordMutation } from '@/queries';
import type { EvidenceFile } from '@/services/mockData';
import type { DprTaskPayload, PlanningEvidenceFile } from '@/services/planning.service';
import type { DprItem } from '@/types/planning';

const initialItems: DprItem[] = dprTaskTemplates.map((task) => ({
  id: task.id,
  label: task.label,
  plannedQty: '',
  completedQty: '',
  worker: '',
  delayReason: '',
}));

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

function fromPlanningEvidence(files: PlanningEvidenceFile[]): EvidenceFile[] {
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

export function useDprForm() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState('2026-07-22');
  const [customerId, setCustomerId] = useState('');

  const customersQuery = useCustomerOptionsQuery();
  const customerOptions = customersQuery.data ?? [];
  const selectedCustomer = customerOptions.find((option) => option.id === customerId) ?? null;
  const projectId = selectedCustomer?.projectId ?? '';
  const siteId = selectedCustomer?.siteId ?? '';

  // Matched by customer, not site - a site can have many customers, and each
  // gets its own DPR record for the same date/supervisor.
  const dprRecordsQuery = useDprRecordsQuery(
    { customerId, date, supervisorId: user?.id },
    { enabled: Boolean(customerId && date && user?.id) },
  );
  const upsertDprRecordMutation = useUpsertDprRecordMutation();

  const [customerSelectOpen, setCustomerSelectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [evidenceLoadToken, setEvidenceLoadToken] = useState(0);
  const [items, setItems] = useState(initialItems);
  const [errors, setErrors] = useState<{ customerId?: boolean }>({});
  const submitting = upsertDprRecordMutation.isPending;

  useEffect(() => {
    if (!customerId || !date || !user?.id || dprRecordsQuery.isLoading) return;

    queueMicrotask(() => {
      const existing = dprRecordsQuery.data?.[0];

      if (existing) {
        setItems(
          dprTaskTemplates.map((task) => {
            const match = existing.tasks.find((item) => item.id === task.id);
            return {
              ...task,
              plannedQty: match?.plannedQty ?? '',
              completedQty: match?.completedQty ?? '',
              worker: match?.worker ?? '',
              delayReason: match?.delayReason ?? '',
            };
          }),
        );
        setRemarks(existing.remarks ?? '');
        setEvidence(fromPlanningEvidence(existing.evidence ?? []));
      } else {
        setItems(initialItems);
        setRemarks('');
        setEvidence([]);
      }
      setEvidenceLoadToken((token) => token + 1);
    });
  }, [customerId, date, user?.id, dprRecordsQuery.data, dprRecordsQuery.isLoading]);

  const totalCompleted = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.completedQty) || 0), 0),
    [items],
  );

  const updateItem = (id: string, field: keyof DprItem, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    setErrors((current) => ({ ...current, customerId: false }));
  };

  const customerSelectOptions = customerOptions.map((option) => ({
    label: option.trBpNo ? `${option.trBpNo} — ${option.name}` : option.name,
    value: option.id,
  }));

  const derivedContext = selectedCustomer
    ? [selectedCustomer.projectName, selectedCustomer.siteArea].filter(Boolean).join(' · ')
    : '';
  const siteLabel = selectedCustomer ? derivedContext || 'Site linked to customer' : 'Select a customer';

  const handleSubmit = async () => {
    if (submitting) return;
    if (!customerId || !projectId || !siteId) {
      setErrors({ customerId: true });
      if (customerId && (!projectId || !siteId)) {
        showToast('This customer has no linked project or site', 'error');
      }
      return;
    }

    setErrors({});

    try {
      const tasks: DprTaskPayload[] = items.map((item) => ({
        id: item.id as DprTaskPayload['id'],
        plannedQty: item.plannedQty || undefined,
        completedQty: item.completedQty || undefined,
        worker: item.worker || undefined,
        delayReason: item.delayReason || undefined,
      }));

      await upsertDprRecordMutation.mutateAsync({
        customerId,
        projectId,
        siteId,
        date,
        status: 'submitted',
        remarks: remarks || undefined,
        tasks,
        evidence: toPlanningEvidence(evidence),
      });
      showToast('DPR submitted', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to submit DPR', 'error');
    }
  };

  return {
    date,
    setDate,
    customerId,
    setCustomerId: handleCustomerChange,
    customerSelectOpen,
    setCustomerSelectOpen,
    customerSelectOptions,
    customersLoading: customersQuery.isLoading,
    customersError: customersQuery.isError,
    refetchCustomers: () => customersQuery.refetch(),
    derivedContext,
    errors,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    evidenceLoadToken,
    items,
    updateItem,
    totalCompleted,
    siteLabel,
    submitting,
    handleSubmit,
  };
}
