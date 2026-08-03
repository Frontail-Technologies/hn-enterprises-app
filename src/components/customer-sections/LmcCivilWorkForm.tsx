import { router } from 'expo-router';
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
import { useUpdateCivilWorkMutation } from '@/queries';
import type { CustomerRecord } from '@/services/mockData';

export function useCivilWorkForm(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateCivilWorkMutation = useUpdateCivilWorkMutation(customer.id);
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
  const { values, updateField, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:lmc-civil`, {
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

  const submit = async () => {
    try {
      await updateCivilWorkMutation.mutateAsync( {
        fourMetresUnderGc: values.fourMetresUnderGc,
        fourMetresAboveGc: values.fourMetresAboveGc,
        tfHalfInch: values.tfHalfInch,
        tfOneInch: values.tfOneInch,
        pcc: values.pcc,
        rccNalaCrossing: values.rccNalaCrossing,
        paverBlocks: values.paverBlocks,
        malua: values.malua,
        hardRock: values.hardRock,
      });
      await clearDraft();
      await onRefetch?.();
      showToast('Civil work submitted', 'success');
      router.back();
    } catch {
      showToast('Unable to submit civil work', 'error');
    }
  };

  const content = (
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
        <EvidenceUploader title="Civil Work Photos" initialFiles={civil.civilEvidence} module="customers" recordId={customer.id} />
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter onSubmit={submit} isSubmitting={updateCivilWorkMutation.isPending} />
  );

  return { content, footer };
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
});
