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
import { useUpdateCivilWorkMutation } from '@/queries';
import { isEvidenceDirty } from '@/utils/evidenceSnapshot';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomerRecord } from '@/types/customers';
import type { EvidenceFile } from '@/types/evidence';

export function useCivilWorkForm(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateCivilWorkMutation = useUpdateCivilWorkMutation(customer.id);
  const [civilEvidence, setCivilEvidence] = useState<EvidenceFile[]>(customer.lmcPipelineWork?.civilEvidence ?? []);
  const [initialCivilEvidence, setInitialCivilEvidence] = useState<EvidenceFile[]>(customer.lmcPipelineWork?.civilEvidence ?? []);
  const civil = customer.lmcPipelineWork ?? {
    pipeRecords: [],
    fourMetresUnderGc: '',
    fourMetresAboveGc: '',
    tfHalfInch: '',
    tfOneInch: '',
    pcc: '',
    rccNalaCrossing: '',
    paverBlocks: '',
    malua: '',
    hardRock: '',
    civilRemarks: '',
    civilEvidence: [],
  };
  const { values, updateField, clearDraft, draftState, loadingDraft, isDirty: valuesDirty } = useDraftForm(`customer:${customer.id}:lmc-civil`, {
    fourMetresUnderGc: civil.fourMetresUnderGc,
    fourMetresAboveGc: civil.fourMetresAboveGc,
    tfHalfInch: civil.tfHalfInch,
    tfOneInch: civil.tfOneInch,
    pcc: civil.pcc,
    rccNalaCrossing: civil.rccNalaCrossing,
    paverBlocks: civil.paverBlocks,
    malua: civil.malua,
    hardRock: civil.hardRock,
    civilRemarks: civil.civilRemarks ?? '',
  });
  const isDirty = valuesDirty || isEvidenceDirty(civilEvidence, initialCivilEvidence);

  const submit = async () => {
    if (!isDirty) return;

    try {
      const updated = await updateCivilWorkMutation.mutateAsync( {
        fourMetresUnderGc: values.fourMetresUnderGc,
        fourMetresAboveGc: values.fourMetresAboveGc,
        tfHalfInch: values.tfHalfInch,
        tfOneInch: values.tfOneInch,
        pcc: values.pcc,
        rccNalaCrossing: values.rccNalaCrossing,
        paverBlocks: values.paverBlocks,
        malua: values.malua,
        hardRock: values.hardRock,
        civilRemarks: values.civilRemarks,
        civilEvidence,
        approvalStatus: 'submitted',
      });
      setInitialCivilEvidence(updated.lmcPipelineWork.civilEvidence ?? []);
      await clearDraft();
      await onRefetch?.();
      showToast('Civil work submitted', 'success');
    } catch (error) {
      console.error('[LmcCivilWorkForm] submit failed', { customerId: customer.id, evidenceCount: civilEvidence.length, error });
      const message = normalizeError(error, 'Unable to submit civil work');
      showToast(message, 'error');
    }
  };

  const content = loadingDraft ? (
    <SectionBodySkeleton />
  ) : (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Civil Quantities</Text>
        <QuantityFieldRow label="4 Metres Under GC" unit="Meter" value={values.fourMetresUnderGc} onChangeText={(value) => updateField('fourMetresUnderGc', value)} />
        <QuantityFieldRow label="4 Metres Above GC" unit="Meter" value={values.fourMetresAboveGc} onChangeText={(value) => updateField('fourMetresAboveGc', value)} />
        <QuantityFieldRow label="TF 1/2 inch" value={values.tfHalfInch} onChangeText={(value) => updateField('tfHalfInch', value)} />
        <QuantityFieldRow label="TF 1 inch" value={values.tfOneInch} onChangeText={(value) => updateField('tfOneInch', value)} />
        <QuantityFieldRow label="PCC" value={values.pcc} onChangeText={(value) => updateField('pcc', value)} />
        <QuantityFieldRow label="RCC / Nala Crossing" value={values.rccNalaCrossing} onChangeText={(value) => updateField('rccNalaCrossing', value)} />
        <QuantityFieldRow label="Paver Blocks" value={values.paverBlocks} onChangeText={(value) => updateField('paverBlocks', value)} />
        <QuantityFieldRow label="Malwa" value={values.malua} onChangeText={(value) => updateField('malua', value)} />
        <QuantityFieldRow label="Hard Rock" value={values.hardRock} onChangeText={(value) => updateField('hardRock', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Input label="Remarks" value={values.civilRemarks} onChangeText={(value) => updateField('civilRemarks', value)} />
        <EvidenceUploader
          title="Civil Work Photos"
          initialFiles={civil.civilEvidence}
          module="customers"
          recordId={customer.id}
          onChange={setCivilEvidence}
          deferUpload
        />
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter onSubmit={submit} isSubmitting={updateCivilWorkMutation.isPending} disabled={!isDirty} />
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
