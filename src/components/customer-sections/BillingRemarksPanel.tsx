import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useMasterValuesQuery, useUpdateBillingMutation } from '@/queries';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomerRecord, EvidenceFile } from '@/services/mockData';

// No backend master category exists for payment status - matches the fixed
// list the web admin panel uses (customers.service.ts paymentStatusOptions)
// so both platforms show the same vocabulary.
const PAYMENT_STATUS_OPTIONS = ['Pending', 'In Review', 'Approved', 'Rejected', 'Completed'].map((status) => ({
  label: status,
  value: status,
}));

export function useBillingRemarksPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateBillingMutation = useUpdateBillingMutation(customer.id);
  const { data: paymentModes = [] } = useMasterValuesQuery('Payment Types');
  const paymentModeOptions = useMemo(() => paymentModes.map((mode) => ({ label: mode, value: mode })), [paymentModes]);
  const [paymentStatusOpen, setPaymentStatusOpen] = useState(false);
  const [paymentModeOpen, setPaymentModeOpen] = useState(false);
  const billing = customer.billingCompletion ?? {
    paymentStatus: '',
    paymentMode: '',
    initialAmount: '',
    jmrDone: false,
    jmrSubmittedInPbg: false,
    giBillDone: false,
    gcBillDone: false,
    conversionBillDone: false,
    remark: '',
    evidence: [],
  };
  const { values, updateField, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:billing`, billing);
  const [evidence, setEvidence] = useState<EvidenceFile[]>(billing.evidence ?? []);

  const submit = async () => {
    try {
      await updateBillingMutation.mutateAsync( {
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
      await clearDraft();
      await onRefetch?.();
      showToast('JMR / billing remarks submitted', 'success');
      router.back();
    } catch (error) {
      console.error('[BillingRemarksPanel] submit failed', { customerId: customer.id, evidenceCount: evidence.length, error });
      const message = normalizeError(error, 'Unable to submit billing remarks');
      showToast(message, 'error');
    }
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
        <SimpleSelect
          label="Payment Status"
          value={values.paymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          open={paymentStatusOpen}
          onOpenChange={setPaymentStatusOpen}
          onChange={(value) => updateField('paymentStatus', value)}
        />
        <SimpleSelect
          label="Payment Mode"
          value={values.paymentMode}
          options={paymentModeOptions}
          open={paymentModeOpen}
          onOpenChange={setPaymentModeOpen}
          onChange={(value) => updateField('paymentMode', value)}
        />
        <Input label="Initial Amount" value={values.initialAmount} editable={false} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Flags</Text>
        <ToggleRow label="JMR Done" value={values.jmrDone} onChange={(value) => updateField('jmrDone', value)} />
        <ToggleRow label="JMR Submitted in PBG" value={values.jmrSubmittedInPbg} onChange={(value) => updateField('jmrSubmittedInPbg', value)} />
        <ToggleRow label="GI Bill Done" value={values.giBillDone} onChange={(value) => updateField('giBillDone', value)} />
        <ToggleRow label="GC Bill Done" value={values.gcBillDone} onChange={(value) => updateField('gcBillDone', value)} />
        <ToggleRow label="Conversion Bill Done" value={values.conversionBillDone} onChange={(value) => updateField('conversionBillDone', value)} />
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
    <SectionFormFooter onSubmit={submit} isSubmitting={updateBillingMutation.isPending} />
  );

  return { content, footer };
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.toggleText, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  toggleRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
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
});
