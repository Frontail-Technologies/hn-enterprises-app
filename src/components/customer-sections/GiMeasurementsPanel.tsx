import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { QuantityFieldRow } from '@/components/shared/QuantityFieldRow';
import { SectionBodySkeleton } from '@/components/shared/SectionBodySkeleton';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useUpdateGiMeasurementsMutation } from '@/queries';
import { isEvidenceDirty } from '@/utils/evidenceSnapshot';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomerRecord } from '@/types/customers';
import type { EvidenceFile } from '@/types/evidence';

export function useGiMeasurementsPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateGiMeasurementsMutation = useUpdateGiMeasurementsMutation(customer.id);
  const gi = customer.giMeasurements ?? {
    tfToRegulator: '',
    inlet: '',
    outlet: '',
    totalGiPipeHalfInch: '',
    giPipeThreeQuarterInch: '',
    giPipeOneInch: '',
    giPipeOneAndHalfInch: '',
    giPipeTwoInch: '',
  };
  const [evidence, setEvidence] = useState<EvidenceFile[]>(gi.evidence ?? []);
  const [initialEvidence, setInitialEvidence] = useState<EvidenceFile[]>(gi.evidence ?? []);
  const { values, updateField, clearDraft, draftState, loadingDraft, isDirty: valuesDirty } = useDraftForm(`customer:${customer.id}:gi`, {
    tfToRegulator: gi.tfToRegulator,
    inlet: gi.inlet,
    outlet: gi.outlet,
    totalGiPipeHalfInch: gi.totalGiPipeHalfInch,
    giPipeThreeQuarterInch: gi.giPipeThreeQuarterInch,
    giPipeOneInch: gi.giPipeOneInch,
    giPipeOneAndHalfInch: gi.giPipeOneAndHalfInch,
    giPipeTwoInch: gi.giPipeTwoInch,
    extraGiAbove10Metres: customer.isolationFittings.extraGiAbove10Metres ?? '',
    remarks: '',
  });
  const isDirty = valuesDirty || isEvidenceDirty(evidence, initialEvidence);

  const submit = async () => {
    if (!isDirty) return;

    try {
      const updated = await updateGiMeasurementsMutation.mutateAsync( {
        tfToRegulator: values.tfToRegulator,
        inlet: values.inlet,
        outlet: values.outlet,
        totalGiPipeHalfInch: values.totalGiPipeHalfInch,
        giPipeThreeQuarterInch: values.giPipeThreeQuarterInch,
        giPipeOneInch: values.giPipeOneInch,
        giPipeOneAndHalfInch: values.giPipeOneAndHalfInch,
        giPipeTwoInch: values.giPipeTwoInch,
        evidence,
        approvalStatus: 'submitted',
      });
      setInitialEvidence(updated.giMeasurements.evidence ?? []);
      await clearDraft();
      await onRefetch?.();
      showToast('GI measurements submitted', 'success');
    } catch (error) {
      console.error('[GiMeasurementsPanel] submit failed', { customerId: customer.id, evidenceCount: evidence.length, error });
      const message = normalizeError(error, 'Unable to submit GI measurements');
      showToast(message, 'error');
    }
  };

  const content = loadingDraft ? (
    <SectionBodySkeleton />
  ) : (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Connection Measurements</Text>
        <QuantityFieldRow label="TF to Regulator" unit="Meter" value={values.tfToRegulator} onChangeText={(value) => updateField('tfToRegulator', value)} />
        <QuantityFieldRow label="Inlet" unit="Meter" value={values.inlet} onChangeText={(value) => updateField('inlet', value)} />
        <QuantityFieldRow label="Outlet" unit="Meter" value={values.outlet} onChangeText={(value) => updateField('outlet', value)} />
        <QuantityFieldRow label="Extra GI above 10 metres" unit="Meter" value={values.extraGiAbove10Metres} onChangeText={(value) => updateField('extraGiAbove10Metres', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Standard Sizes</Text>
        <QuantityFieldRow label="GI Pipe 1/2 inch" unit="Meter" value={values.totalGiPipeHalfInch} onChangeText={(value) => updateField('totalGiPipeHalfInch', value)} />
        <QuantityFieldRow label="GI Pipe 3/4 inch" unit="Meter" value={values.giPipeThreeQuarterInch} onChangeText={(value) => updateField('giPipeThreeQuarterInch', value)} />
        <QuantityFieldRow label="GI Pipe 1 inch" unit="Meter" value={values.giPipeOneInch} onChangeText={(value) => updateField('giPipeOneInch', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Large Sizes</Text>
        <QuantityFieldRow label="GI Pipe 1.5 inch" unit="Meter" value={values.giPipeOneAndHalfInch} onChangeText={(value) => updateField('giPipeOneAndHalfInch', value)} />
        <QuantityFieldRow label="GI Pipe 2 inch" unit="Meter" value={values.giPipeTwoInch} onChangeText={(value) => updateField('giPipeTwoInch', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Input label="Remarks" value={values.remarks} onChangeText={(value) => updateField('remarks', value)} />
        <EvidenceUploader
          title="GI Photos"
          initialFiles={gi.evidence}
          module="customers"
          recordId={customer.id}
          onChange={setEvidence}
          deferUpload
        />
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter onSubmit={submit} isSubmitting={updateGiMeasurementsMutation.isPending} disabled={!isDirty} />
  );

  return { content, footer };
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
    padding: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
});
