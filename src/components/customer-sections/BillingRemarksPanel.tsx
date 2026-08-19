import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { EvidenceUploader } from "@/components/shared/EvidenceUploader";
import { FormStateBanner } from "@/components/shared/FormStateBanner";
import { SectionBodySkeleton } from "@/components/shared/SectionBodySkeleton";
import { SectionFormFooter } from "@/components/shared/SectionFormFooter";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Card } from "@/components/ui/Card";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useDraftForm } from "@/hooks/useDraftForm";
import {
  useMasterValuesQuery,
  useSetSectionCompletionMutation,
  useUpdateBillingMutation,
} from "@/queries";
import { isEvidenceDirty } from "@/utils/evidenceSnapshot";
import { formatDate } from "@/utils/format";
import { normalizeError } from "@/utils/normalizeError";
import type {
  CompletionSectionKey,
  CustomerRecord,
  SectionCompletionResult,
} from "@/types/customers";
import type { EvidenceFile } from "@/types/evidence";

const PAYMENT_STATUS_OPTIONS = [
  "Pending",
  "In Review",
  "Approved",
  "Rejected",
  "Completed",
].map((status) => ({
  label: status,
  value: status,
}));

export function useBillingRemarksPanel(
  customer: CustomerRecord,
  onRefetch?: () => Promise<void>,
) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateBillingMutation = useUpdateBillingMutation(customer.id);
  const { data: paymentModes = [] } = useMasterValuesQuery("Payment Types");
  const paymentModeOptions = useMemo(
    () => paymentModes.map((mode) => ({ label: mode, value: mode })),
    [paymentModes],
  );
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
  const [paymentModeOpen, setPaymentModeOpen] = useState(false);
  const billing = customer.billingCompletion ?? {
    paymentStatus: "",
    paymentMode: "",
    initialAmount: "",
    jmrDone: false,
    jmrSubmittedInPbg: false,
    giBillDone: false,
    gcBillDone: false,
    conversionBillDone: false,
    remark: "",
    evidence: [],
  };
  const {
    values,
    updateField,
    clearDraft,
    draftState,
    loadingDraft,
    isDirty: valuesDirty,
  } = useDraftForm(`customer:${customer.id}:billing`, billing);
  const [evidence, setEvidence] = useState<EvidenceFile[]>(
    billing.evidence ?? [],
  );
  const [initialEvidence, setInitialEvidence] = useState<EvidenceFile[]>(
    billing.evidence ?? [],
  );
  const isDirty = valuesDirty || isEvidenceDirty(evidence, initialEvidence);

  const submit = async () => {
    if (!isDirty) return;

    try {
      const updated = await updateBillingMutation.mutateAsync({
        paymentStatus: values.paymentStatus,
        paymentMode: values.paymentMode,
        initialAmount: values.initialAmount,
        jmrDone: values.jmrDone,
        jmrSubmittedInPbg: values.jmrSubmittedInPbg,
        giBillDone: values.giBillDone,
        gcBillDone: values.gcBillDone,
        conversionBillDone: values.conversionBillDone,
        remark: billing.remark,
        evidence,
      });
      setInitialEvidence(updated.billingCompletion.evidence ?? []);
      await clearDraft();
      await onRefetch?.();
      showToast("JMR / billing remarks submitted", "success");
    } catch (error) {
      console.error("[BillingRemarksPanel] submit failed", {
        customerId: customer.id,
        evidenceCount: evidence.length,
        error,
      });
      const message = normalizeError(error, "Unable to submit billing remarks");
      showToast(message, "error");
    }
  };

  const content = loadingDraft ? (
    <SectionBodySkeleton />
  ) : (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Payment Summary
        </Text>
        <SimpleSelect
          label="Payment Status"
          value={values.paymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          open={paymentStatusOpen}
          onOpenChange={setPaymentStatusOpen}
          onChange={(value) => updateField("paymentStatus", value)}
        />
        <SimpleSelect
          label="Payment Mode"
          value={values.paymentMode}
          options={paymentModeOptions}
          open={paymentModeOpen}
          onOpenChange={setPaymentModeOpen}
          onChange={(value) => updateField("paymentMode", value)}
        />
        <Input
          label="Initial Amount"
          value={values.initialAmount}
          editable={false}
        />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Completion Flags
        </Text>
        <ToggleRow
          label="JMR Done"
          value={values.jmrDone}
          onChange={(value) => updateField("jmrDone", value)}
        />
        <ToggleRow
          label="JMR Submitted in PBG"
          value={values.jmrSubmittedInPbg}
          onChange={(value) => updateField("jmrSubmittedInPbg", value)}
        />
        <ToggleRow
          label="GI Bill Done"
          value={values.giBillDone}
          onChange={(value) => updateField("giBillDone", value)}
        />
        <ToggleRow
          label="GC Bill Done"
          value={values.gcBillDone}
          onChange={(value) => updateField("gcBillDone", value)}
        />
        <ToggleRow
          label="Conversion Bill Done"
          value={values.conversionBillDone}
          onChange={(value) => updateField("conversionBillDone", value)}
        />
        {/* Progress milestones (backend `progress_milestones` keys, canonical
            names unchanged) - unlike the flags above these save immediately
            per switch via the existing completion API, not the form's Save
            button, matching how every other section's Mark Complete/Reopen
            already behaves. */}
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="gc"
          label="GC Done"
          result={customer.sectionCompletion?.gc}
          completedOn={customer.completionAudit?.gcCompletedOn}
          completedBy={customer.completionAudit?.gcCompletedBy}
        />
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="valveChamber"
          label="Valve Chamber"
          result={customer.sectionCompletion?.valveChamber}
          completedOn={customer.completionAudit?.valveChamberCompletedOn}
          completedBy={customer.completionAudit?.valveChamberCompletedBy}
        />
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="poleMarker"
          label="Pole Marker"
          result={customer.sectionCompletion?.poleMarker}
          completedOn={customer.completionAudit?.poleMarkerCompletedOn}
          completedBy={customer.completionAudit?.poleMarkerCompletedBy}
        />
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="routeMarker"
          label="Route Marker"
          result={customer.sectionCompletion?.routeMarker}
          completedOn={customer.completionAudit?.routeMarkerCompletedOn}
          completedBy={customer.completionAudit?.routeMarkerCompletedBy}
        />
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="preCommissioning"
          label="Pre Commissioning"
          result={customer.sectionCompletion?.preCommissioning}
          completedOn={customer.completionAudit?.preCommissioningCompletedOn}
          completedBy={customer.completionAudit?.preCommissioningCompletedBy}
        />
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="connection"
          label="Connection Done"
          result={customer.sectionCompletion?.connection}
          completedOn={customer.completionAudit?.connectionCompletedOn}
          completedBy={customer.completionAudit?.connectionCompletedBy}
        />
        <MilestoneToggleRow
          customerId={customer.id}
          sectionKey="siteExpenses"
          label="Site Expenses Done"
          result={customer.sectionCompletion?.siteExpenses}
          completedOn={customer.completionAudit?.siteExpensesCompletedOn}
          completedBy={customer.completionAudit?.siteExpensesCompletedBy}
        />
      </Card>

      <Card style={styles.formCard}>
        <EvidenceUploader
          title="Supporting Photo / Document"
          initialFiles={billing.evidence}
          module="customers"
          recordId={customer.id}
          onChange={setEvidence}
          deferUpload
        />
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter
      onSubmit={submit}
      isSubmitting={updateBillingMutation.isPending}
      disabled={!isDirty}
    />
  );

  return { content, footer };
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.toggleRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.toggleText, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

// Same visual row as ToggleRow, but backed by the audited completion API
// instead of a plain form field: switching on marks the milestone complete
// immediately (backend stamps completedAt/completedBy); switching off asks
// for confirmation first, exactly like every other section's Reopen action,
// and reverts to on if the reopen is cancelled or blocked (e.g. GC Bill Done).
function MilestoneToggleRow({
  customerId,
  sectionKey,
  label,
  result,
  completedOn,
  completedBy,
}: {
  customerId: string;
  sectionKey: CompletionSectionKey;
  label: string;
  result?: SectionCompletionResult;
  completedOn?: string | null;
  completedBy?: string | null;
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const mutation = useSetSectionCompletionMutation(customerId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDone = result?.status === "DONE";

  const run = (completed: boolean) => {
    if (mutation.isPending) return;
    mutation.mutate(
      { sectionKey, completed },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          showToast(
            completed ? `${label} marked complete.` : `${label} reopened.`,
            "success",
          );
        },
        onError: (error) => {
          setConfirmOpen(false);
          showToast(
            error instanceof Error
              ? error.message
              : "Unable to update completion",
            "error",
          );
        },
      },
    );
  };

  return (
    <View
      style={[
        styles.toggleRow,
        styles.milestoneToggleRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.milestoneToggleInfo}>
        <Text style={[styles.toggleText, { color: colors.text }]}>{label}</Text>
        {isDone && (completedOn || completedBy) ? (
          <Text
            style={[styles.milestoneMeta, { color: colors.muted }]}
            numberOfLines={1}
          >
            {completedOn ? `Completed ${formatDate(completedOn)}` : null}
            {completedOn && completedBy ? " · " : null}
            {completedBy ? `by ${completedBy}` : null}
          </Text>
        ) : null}
      </View>
      <Switch
        value={isDone}
        disabled={mutation.isPending}
        onValueChange={(next) => (next ? run(true) : setConfirmOpen(true))}
      />
      <ConfirmSheet
        visible={confirmOpen}
        title={`Reopen ${label}?`}
        message="This will mark the milestone as pending again. Existing data will be kept."
        confirmLabel="Reopen"
        cancelLabel="Cancel"
        onConfirm={() => run(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
    padding: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  toggleRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  toggleText: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  milestoneToggleRow: {
    paddingVertical: spacing.xs,
  },
  milestoneToggleInfo: {
    flex: 1,
    gap: 2,
  },
  milestoneMeta: {
    ...typography.caption,
    fontSize: 11,
  },
});
