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

export function useIsolationRegulatorsPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const source = customer.isolationFittings ?? {
    isolationValveHalfInch: '',
    isolationValveThreeQuarterInch: '',
    isolationValveOneInch: '',
    isolationValveOneAndHalfInch: '',
    isolationValveTwoInch: '',
    applianceValveHalfInch: '',
    regulator6BarTo100Mbar: '',
    regulator6BarTo21Mbar: '',
    regulator100MbarTo21Mbar: '',
    warningPlate: '',
    clampHalfInch: '',
    elbowHalfInch: '',
    teeHalfInch: '',
    extraGiAbove10Metres: '',
  };
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:isolation`, {
    ...source,
    remarks: '',
  });

  const save = async () => {
    await saveDraft();
    showToast('Isolation draft saved', 'success');
  };
  const submit = async () => {
    try {
      await customersService.updateIsolationRegulators(customer.id, {
        isolationValveHalfInch: values.isolationValveHalfInch,
        isolationValveThreeQuarterInch: values.isolationValveThreeQuarterInch,
        isolationValveOneInch: values.isolationValveOneInch,
        isolationValveOneAndHalfInch: values.isolationValveOneAndHalfInch,
        isolationValveTwoInch: values.isolationValveTwoInch,
        applianceValveHalfInch: values.applianceValveHalfInch,
        regulator6BarTo100Mbar: values.regulator6BarTo100Mbar,
        regulator6BarTo21Mbar: values.regulator6BarTo21Mbar,
        regulator100MbarTo21Mbar: values.regulator100MbarTo21Mbar,
        warningPlate: values.warningPlate,
      });
      await clearDraft();
      await onRefetch?.();
      showToast('Isolation and regulators submitted', 'success');
      router.back();
    } catch {
      showToast('Unable to submit isolation and regulators', 'error');
    }
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Isolation Valves</Text>
        <QuantityFieldRow label="Isolation Valve 1/2 inch" value={values.isolationValveHalfInch} onChangeText={(value) => updateField('isolationValveHalfInch', value)} />
        <QuantityFieldRow label="Isolation Valve 3/4 inch" value={values.isolationValveThreeQuarterInch} onChangeText={(value) => updateField('isolationValveThreeQuarterInch', value)} />
        <QuantityFieldRow label="Isolation Valve 1 inch" value={values.isolationValveOneInch} onChangeText={(value) => updateField('isolationValveOneInch', value)} />
        <QuantityFieldRow label="Isolation Valve 1.5 inch" value={values.isolationValveOneAndHalfInch} onChangeText={(value) => updateField('isolationValveOneAndHalfInch', value)} />
        <QuantityFieldRow label="Isolation Valve 2 inch" value={values.isolationValveTwoInch} onChangeText={(value) => updateField('isolationValveTwoInch', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Regulators & Other</Text>
        <QuantityFieldRow label="Appliance Valve 1/2 inch" value={values.applianceValveHalfInch} onChangeText={(value) => updateField('applianceValveHalfInch', value)} />
        <QuantityFieldRow label="Regulator 6 Bar to 100 mbar" value={values.regulator6BarTo100Mbar} onChangeText={(value) => updateField('regulator6BarTo100Mbar', value)} />
        <QuantityFieldRow label="Regulator 6 Bar to 21 mbar" value={values.regulator6BarTo21Mbar} onChangeText={(value) => updateField('regulator6BarTo21Mbar', value)} />
        <QuantityFieldRow label="Regulator 100 mbar to 21 mbar" value={values.regulator100MbarTo21Mbar} onChangeText={(value) => updateField('regulator100MbarTo21Mbar', value)} />
        <QuantityFieldRow label="Warning Plate" value={values.warningPlate} onChangeText={(value) => updateField('warningPlate', value)} />
      </Card>

      <Card style={styles.formCard}>
        <Input label="Remarks" value={values.remarks} onChangeText={(value) => updateField('remarks', value)} />
        <EvidenceUploader title="Isolation / Regulator Photos" module="customers" recordId={customer.id} />
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
