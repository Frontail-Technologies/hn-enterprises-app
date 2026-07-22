import { router } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { MeterReadingInput } from '@/components/shared/MeterReadingInput';
import { RequiredLabel } from '@/components/shared/RequiredLabel';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import type { CustomerRecord } from '@/services/mockData';

export function useMeterCommissioningPanel(customer: CustomerRecord) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const meter = customer.commissioningConversion ?? {
    meterNo: '',
    installationDate: '',
    commissioningDate: '',
    conversionDate: '',
    regulatorPressure: '',
    regulatorNo: '',
    meterType: '',
    meterReading: '',
    nonConversionRemark: '',
    evidence: [],
  };
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:meter`, {
    ...meter,
    meterReading: meter.meterReading.replace(/\D/g, ''),
  });
  const { ref: remarkRef, onFocus: remarkOnFocus } = useScrollIntoViewOnFocus();

  const save = async () => {
    await saveDraft();
    showToast('Meter draft saved', 'success');
  };
  const submit = async () => {
    await clearDraft();
    showToast('Meter & commissioning submitted', 'success');
    router.back();
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meter Details</Text>
        <Input label="Meter Number" value={values.meterNo} onChangeText={(value) => updateField('meterNo', value)} />
        <Input label="Meter Type" value={values.meterType} onChangeText={(value) => updateField('meterType', value)} />
        <Input label="Regulator Pressure" value={values.regulatorPressure} onChangeText={(value) => updateField('regulatorPressure', value)} />
        <Input label="Regulator Number" value={values.regulatorNo} onChangeText={(value) => updateField('regulatorNo', value)} />
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Meter Reading" required />
          <MeterReadingInput value={values.meterReading} onChangeText={(value) => updateField('meterReading', value)} />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Important Dates</Text>
        <DateField label="Installation Date" value={values.installationDate} onChangeText={(value) => updateField('installationDate', value)} />
        <DateField label="Commissioning Date" value={values.commissioningDate} onChangeText={(value) => updateField('commissioningDate', value)} />
        <DateField label="Conversion Date" value={values.conversionDate} onChangeText={(value) => updateField('conversionDate', value)} />
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Non-Conversion Remark" />
          <TextInput
            ref={remarkRef}
            onFocus={remarkOnFocus}
            value={values.nonConversionRemark}
            onChangeText={(value) => updateField('nonConversionRemark', value)}
            multiline
            placeholder="Add non-conversion remark..."
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            textAlignVertical="top"
          />
        </View>
        <EvidenceUploader title="Meter Photo / Installation Photos" initialFiles={meter.evidence} />
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
  fieldGroup: {
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
