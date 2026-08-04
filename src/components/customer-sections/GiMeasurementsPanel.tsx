import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { QuantityFieldRow } from '@/components/shared/QuantityFieldRow';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useUpdateGiMeasurementsMutation } from '@/queries';
import { ApiError } from '@/services/apiClient';
import type { CustomerRecord, EvidenceFile } from '@/services/mockData';

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
  const { values, updateField, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:gi`, {
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

  const submit = async () => {
    try {
      await updateGiMeasurementsMutation.mutateAsync( {
        tfToRegulator: values.tfToRegulator,
        inlet: values.inlet,
        outlet: values.outlet,
        totalGiPipeHalfInch: values.totalGiPipeHalfInch,
        giPipeThreeQuarterInch: values.giPipeThreeQuarterInch,
        giPipeOneInch: values.giPipeOneInch,
        giPipeOneAndHalfInch: values.giPipeOneAndHalfInch,
        giPipeTwoInch: values.giPipeTwoInch,
        evidence,
      });
      await clearDraft();
      await onRefetch?.();
      showToast('GI measurements submitted', 'success');
      router.back();
    } catch (error) {
      console.error('[GiMeasurementsPanel] submit failed', { customerId: customer.id, evidenceCount: evidence.length, error });
      const message = error instanceof ApiError ? error.message : 'Unable to submit GI measurements';
      showToast(message, 'error');
    }
  };

  const content = (
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
    <SectionFormFooter onSubmit={submit} isSubmitting={updateGiMeasurementsMutation.isPending} />
  );

  return { content, footer };
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
});
