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
import type { CustomerRecord } from '@/services/mockData';

export function useCivilWorkForm(customer: CustomerRecord, onDone?: () => void) {
  const { colors } = useTheme();
  const { showToast } = useToast();
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
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:lmc-civil`, {
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

  const save = async () => {
    await saveDraft();
    showToast('Civil work draft saved', 'success');
  };
  const submit = async () => {
    await clearDraft();
    showToast('Civil work submitted', 'success');
    if (onDone) onDone();
    else router.back();
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
        <EvidenceUploader title="Civil Work Photos" initialFiles={civil.civilEvidence} />
      </Card>
    </>
  );

  const footer = <SectionFormFooter onSaveDraft={save} onSubmit={submit} />;

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
