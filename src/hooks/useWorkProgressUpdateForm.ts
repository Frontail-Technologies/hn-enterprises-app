import { router } from "expo-router";
import { useState } from "react";

import { useToast } from "@/context/ToastContext";
import { useCreateWorkProgressMutation } from "@/queries";
import type { EvidenceFile, WorkProgressStatus, WorkStage } from "@/services/mockData";
import { toWorkProgressEvidence, type buildDetailRecord } from "@/services/workProgress.service";

export function useWorkProgressUpdateForm({
  customerId,
  mode,
  record,
}: {
  customerId: string;
  mode?: string;
  record: ReturnType<typeof buildDetailRecord>;
}) {
  const { showToast } = useToast();
  const [stage, setStage] = useState<WorkStage>(record.currentStage);
  const [status, setStatus] = useState<WorkProgressStatus>(
    record.status === "Not Started" ? "In Progress" : record.status,
  );
  const [nextRequiredAction, setNextRequiredAction] = useState(record.nextRequiredAction);
  const [remarks, setRemarks] = useState(mode === "evidence" ? "Evidence uploaded from field visit." : "");
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const createWorkProgressMutation = useCreateWorkProgressMutation();

  const handleSubmit = async () => {
    if (createWorkProgressMutation.isPending) return;

    try {
      await createWorkProgressMutation.mutateAsync({
        customerId,
        stage,
        status,
        nextRequiredAction: nextRequiredAction.trim() || undefined,
        remarks: remarks.trim() || undefined,
        evidence: toWorkProgressEvidence(evidence),
      });
      showToast(record.status === "Sent Back" ? "Work update resubmitted" : "Work progress submitted", "success");
      router.back();
    } catch (error: any) { showToast(error?.message || "Unable to submit work update", "error"); }
  };

  return {
    stage,
    setStage,
    status,
    setStatus,
    nextRequiredAction,
    setNextRequiredAction,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    isSubmitting: createWorkProgressMutation.isPending,
    handleSubmit,
  };
}
