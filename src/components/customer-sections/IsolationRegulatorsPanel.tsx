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
import { useUpdateIsolationRegulatorsMutation } from '@/queries';
import { isEvidenceDirty } from '@/utils/evidenceSnapshot';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomerRecord } from '@/types/customers';
import type { EvidenceFile } from '@/types/evidence';

export function useIsolationRegulatorsPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateIsolationRegulatorsMutation = useUpdateIsolationRegulatorsMutation(customer.id);
  const [evidence, setEvidence] = useState<EvidenceFile[]>(customer.isolationFittings?.evidence ?? []);
  const [initialEvidence, setInitialEvidence] = useState<EvidenceFile[]>(customer.isolationFittings?.evidence ?? []);
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
  const { values, updateField, clearDraft, draftState, loadingDraft, isDirty: valuesDirty } = useDraftForm(`customer:${customer.id}:isolation`, {
    ...source,
    remarks: '',
  });
  const isDirty = valuesDirty || isEvidenceDirty(evidence, initialEvidence);

  const submit = async () => {
    if (!isDirty) return;

    try {
      const updated = await updateIsolationRegulatorsMutation.mutateAsync({
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
        clampHalfInch: values.clampHalfInch,
        elbowHalfInch: values.elbowHalfInch,
        teeHalfInch: values.teeHalfInch,
        extraGiAbove10Metres: values.extraGiAbove10Metres,
        evidence,
      });
      setInitialEvidence(updated.isolationFittings?.evidence ?? []);
      await clearDraft();
      await onRefetch?.();
      showToast('Isolation and regulators submitted', 'success');
    } catch (error) {
      console.error('[IsolationRegulatorsPanel] submit failed', { customerId: customer.id, evidenceCount: evidence.length, error });
      const message = normalizeError(error, 'Unable to submit isolation and regulators');
      showToast(message, 'error');
    }
  };

  const content = loadingDraft ? (
    <SectionBodySkeleton />
  ) : (
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
        <EvidenceUploader
          title="Isolation / Regulator Photos"
          initialFiles={customer.isolationFittings?.evidence}
          module="customers"
          recordId={customer.id}
          onChange={setEvidence}
          deferUpload
        />
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter onSubmit={submit} isSubmitting={updateIsolationRegulatorsMutation.isPending} disabled={!isDirty} />
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
