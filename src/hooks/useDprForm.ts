import { useEffect, useMemo, useState } from 'react';

import { dprTaskTemplates } from '@/constants/dprTasks';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useDprRecordsQuery, useProjectSitesQuery, useProjectsQuery, useUpsertDprRecordMutation } from '@/queries';
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
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const projectsQuery = useProjectsQuery();
  const siteOptionsQuery = useProjectSitesQuery(projectId);
  const dprRecordsQuery = useDprRecordsQuery(
    { siteId, date, supervisorId: user?.id },
    { enabled: Boolean(siteId && date && user?.id) },
  );
  const upsertDprRecordMutation = useUpsertDprRecordMutation();
  const projects = projectsQuery.data ?? [];
  const siteOptions = siteOptionsQuery.data ?? [];
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [siteSelectOpen, setSiteSelectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [evidenceLoadToken, setEvidenceLoadToken] = useState(0);
  const [items, setItems] = useState(initialItems);
  const submitting = upsertDprRecordMutation.isPending;

  useEffect(() => {
    if (!siteId || !date || !user?.id || dprRecordsQuery.isLoading) return;

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
  }, [siteId, date, user?.id, dprRecordsQuery.data, dprRecordsQuery.isLoading]);

  const totalCompleted = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.completedQty) || 0), 0),
    [items],
  );

  const updateItem = (id: string, field: keyof DprItem, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleProjectChange = (value: string) => {
    setProjectId(value);
    setSiteId('');
  };

  const projectOptions = projects.map((project) => ({ label: project.name, value: project.id }));
  const siteSelectOptions = siteOptions.map((option) => ({ label: option.name, value: option.id }));
  const siteLabel = siteOptions.find((option) => option.id === siteId)?.name ?? 'Select a site';

  const handleSubmit = async () => {
    if (!projectId || !siteId) {
      showToast('Select a project and site first', 'error');
      return;
    }

    try {
      const tasks: DprTaskPayload[] = items.map((item) => ({
        id: item.id as DprTaskPayload['id'],
        plannedQty: item.plannedQty || undefined,
        completedQty: item.completedQty || undefined,
        worker: item.worker || undefined,
        delayReason: item.delayReason || undefined,
      }));

      await upsertDprRecordMutation.mutateAsync({
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
    projectId,
    handleProjectChange,
    siteId,
    setSiteId,
    projectSelectOpen,
    setProjectSelectOpen,
    siteSelectOpen,
    setSiteSelectOpen,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    evidenceLoadToken,
    items,
    updateItem,
    totalCompleted,
    projectOptions,
    siteSelectOptions,
    siteLabel,
    submitting,
    handleSubmit,
  };
}
