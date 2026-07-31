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
import { customersService } from '@/services/customers.service';
import type { CustomerRecord } from '@/services/mockData';

export function useGiMeasurementsPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
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
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:gi`, {
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

  const save = async () => {
    await saveDraft();
    showToast('GI draft saved', 'success');
  };
  const submit = async () => {
    try {
      await customersService.updateGiMeasurements(customer.id, {
        tfToRegulator: values.tfToRegulator,
        inlet: values.inlet,
        outlet: values.outlet,
        totalGiPipeHalfInch: values.totalGiPipeHalfInch,
        giPipeThreeQuarterInch: values.giPipeThreeQuarterInch,
        giPipeOneInch: values.giPipeOneInch,
        giPipeOneAndHalfInch: values.giPipeOneAndHalfInch,
        giPipeTwoInch: values.giPipeTwoInch,
      });
      await clearDraft();
      await onRefetch?.();
      showToast('GI measurements submitted', 'success');
      router.back();
    } catch {
      showToast('Unable to submit GI measurements', 'error');
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
        <EvidenceUploader title="GI Photos" module="customers" recordId={customer.id} />
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
