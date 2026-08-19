import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
import { useUpdateFittingsAccessoriesMutation } from '@/queries';
import { isEvidenceDirty } from '@/utils/evidenceSnapshot';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomerRecord } from '@/types/customers';
import type { EvidenceFile } from '@/types/evidence';

export function useFittingsAccessoriesPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateFittingsAccessoriesMutation = useUpdateFittingsAccessoriesMutation(customer.id);
  const fallback = customer.fittingsAccessories ?? {
    clampHalfInch: customer.isolationFittings.clampHalfInch ?? '',
    clampThreeInchToHalfInch: '0',
    elbowHalfInch: customer.isolationFittings.elbowHalfInch ?? '',
    mfElbowHalfInch: '0',
    socketHalfInch: '0',
    teeHalfInch: customer.isolationFittings.teeHalfInch ?? '',
    nippleTwoInch: '0',
    nippleThreeInch: '0',
    nippleFourInch: '0',
    reducerElbowThreeQuarterToHalfInch: '0',
    threeQuarterInchToThreeInch: '0',
    unionHalfInch: '0',
    plugHalfInch: '0',
    fittingsOneAndHalfInch: '0',
    fittingsTwoInch: '0',
    remarks: '',
    evidence: [] as EvidenceFile[],
  };
  const { evidence: fallbackEvidenceRaw, ...fallbackValues } = fallback;
  const fallbackEvidence = fallbackEvidenceRaw ?? [];
  const { values, updateField, clearDraft, draftState, loadingDraft, isDirty: valuesDirty } = useDraftForm(`customer:${customer.id}:fittings`, fallbackValues);
  const [evidence, setEvidence] = useState<EvidenceFile[]>(fallbackEvidence);
  const [initialEvidence, setInitialEvidence] = useState<EvidenceFile[]>(fallbackEvidence);
  const isDirty = valuesDirty || isEvidenceDirty(evidence, initialEvidence);

  const submit = async () => {
    if (!isDirty) return;

    try {
      const updated = await updateFittingsAccessoriesMutation.mutateAsync( {
        clampHalfInch: values.clampHalfInch,
        clampThreeInchToHalfInch: values.clampThreeInchToHalfInch,
        elbowHalfInch: values.elbowHalfInch,
        mfElbowHalfInch: values.mfElbowHalfInch,
        socketHalfInch: values.socketHalfInch,
        teeHalfInch: values.teeHalfInch,
        nippleTwoInch: values.nippleTwoInch,
        nippleThreeInch: values.nippleThreeInch,
        nippleFourInch: values.nippleFourInch,
        reducerElbowThreeQuarterToHalfInch: values.reducerElbowThreeQuarterToHalfInch,
        threeQuarterInchToThreeInch: values.threeQuarterInchToThreeInch,
        unionHalfInch: values.unionHalfInch,
        plugHalfInch: values.plugHalfInch,
        fittingsOneAndHalfInch: values.fittingsOneAndHalfInch,
        fittingsTwoInch: values.fittingsTwoInch,
        evidence,
      });
      setInitialEvidence(updated.fittingsAccessories?.evidence ?? []);
      await clearDraft();
      await onRefetch?.();
      showToast('Fittings submitted', 'success');
    } catch (error) {
      console.error('[FittingsAccessoriesPanel] submit failed', { customerId: customer.id, evidenceCount: evidence.length, error });
      const message = normalizeError(error, 'Unable to submit fittings');
      showToast(message, 'error');
    }
  };

  const content = loadingDraft ? (
    <SectionBodySkeleton />
  ) : (
    <View style={styles.sections}>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Clamps & Elbows</Text>
        <QuantityFieldRow label="Clamp 1/2 inch" value={values.clampHalfInch} onChangeText={(value) => updateField('clampHalfInch', value)} />
        <QuantityFieldRow label="Clamp 3 inch to 1/2 inch" value={values.clampThreeInchToHalfInch} onChangeText={(value) => updateField('clampThreeInchToHalfInch', value)} />
        <QuantityFieldRow label="Elbow 1/2 inch" value={values.elbowHalfInch} onChangeText={(value) => updateField('elbowHalfInch', value)} />
        <QuantityFieldRow label="M/F Elbow 1/2 inch" value={values.mfElbowHalfInch} onChangeText={(value) => updateField('mfElbowHalfInch', value)} />
        <QuantityFieldRow label="Tee 1/2 inch" value={values.teeHalfInch} onChangeText={(value) => updateField('teeHalfInch', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Nipples & Sockets</Text>
        <QuantityFieldRow label="Socket 1/2 inch" value={values.socketHalfInch} onChangeText={(value) => updateField('socketHalfInch', value)} />
        <QuantityFieldRow label="Nipple 2 inch" value={values.nippleTwoInch} onChangeText={(value) => updateField('nippleTwoInch', value)} />
        <QuantityFieldRow label="Nipple 3 inch" value={values.nippleThreeInch} onChangeText={(value) => updateField('nippleThreeInch', value)} />
        <QuantityFieldRow label="Nipple 4 inch" value={values.nippleFourInch} onChangeText={(value) => updateField('nippleFourInch', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Reducers & Other</Text>
        <QuantityFieldRow label="Reducer Elbow 3/4 to 1/2 inch" value={values.reducerElbowThreeQuarterToHalfInch} onChangeText={(value) => updateField('reducerElbowThreeQuarterToHalfInch', value)} />
        <QuantityFieldRow label="3/4 inch to 3 inch" value={values.threeQuarterInchToThreeInch} onChangeText={(value) => updateField('threeQuarterInchToThreeInch', value)} />
        <QuantityFieldRow label="Union 1/2 inch" value={values.unionHalfInch} onChangeText={(value) => updateField('unionHalfInch', value)} />
        <QuantityFieldRow label="Plug 1/2 inch" value={values.plugHalfInch} onChangeText={(value) => updateField('plugHalfInch', value)} />
        <QuantityFieldRow label="1.5 inch fittings quantity" value={values.fittingsOneAndHalfInch} onChangeText={(value) => updateField('fittingsOneAndHalfInch', value)} />
        <QuantityFieldRow label="2 inch fittings quantity" value={values.fittingsTwoInch} onChangeText={(value) => updateField('fittingsTwoInch', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Input label="Remarks" value={values.remarks ?? ''} onChangeText={(value) => updateField('remarks', value)} />
        <EvidenceUploader
          title="Fittings Evidence"
          initialFiles={fallbackEvidence}
          module="customers"
          recordId={customer.id}
          onChange={setEvidence}
          deferUpload
        />
      </Card>
    </View>
  );

  const footer = (
    <SectionFormFooter onSubmit={submit} isSubmitting={updateFittingsAccessoriesMutation.isPending} disabled={!isDirty} />
  );

  return { content, footer };
}

const styles = StyleSheet.create({
  sections: {
    gap: spacing.md,
  },
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
