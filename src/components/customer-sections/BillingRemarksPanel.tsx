import { router } from 'expo-router';
import { CheckSquare2, Square } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { RequiredLabel } from '@/components/shared/RequiredLabel';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import type { CustomerRecord } from '@/services/mockData';

export function useBillingRemarksPanel(customer: CustomerRecord) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const billing = customer.billingCompletion ?? {
    paymentStatus: '',
    paymentMode: '',
    initialAmount: '',
    jmrDone: false,
    jmrSubmittedInPbg: false,
    giBillDone: false,
    gcBillDone: false,
    conversionBillDone: false,
    remark: '',
    evidence: [],
  };
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:billing`, billing);
  const { ref: remarkRef, onFocus: remarkOnFocus } = useScrollIntoViewOnFocus();

  const save = async () => {
    await saveDraft();
    showToast('Billing remarks draft saved', 'success');
  };
  const submit = async () => {
    await clearDraft();
    showToast('JMR / billing remarks submitted', 'success');
    router.back();
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Summary</Text>
        <Input label="Payment Status" value={values.paymentStatus} onChangeText={(value) => updateField('paymentStatus', value)} />
        <Input label="Payment Mode" value={values.paymentMode} onChangeText={(value) => updateField('paymentMode', value)} />
        <Input label="Initial Amount" value={values.initialAmount} editable={false} />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Completion Flags</Text>
        <ToggleRow label="JMR Done" value={values.jmrDone} onChange={(value) => updateField('jmrDone', value)} />
        <ToggleRow label="JMR Submitted in PBG" value={values.jmrSubmittedInPbg} onChange={(value) => updateField('jmrSubmittedInPbg', value)} />
        <ToggleRow label="GI Bill Done" value={values.giBillDone} onChange={(value) => updateField('giBillDone', value)} />
        <ToggleRow label="GC Bill Done" value={values.gcBillDone} onChange={(value) => updateField('gcBillDone', value)} />
        <ToggleRow label="Conversion Bill Done" value={values.conversionBillDone} onChange={(value) => updateField('conversionBillDone', value)} />
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Final Remark" />
          <TextInput
            ref={remarkRef}
            onFocus={remarkOnFocus}
            value={values.remark}
            onChangeText={(value) => updateField('remark', value)}
            multiline
            placeholder="Add final remark..."
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            textAlignVertical="top"
          />
        </View>
        <EvidenceUploader title="Supporting Photo / Document" initialFiles={billing.evidence} />
      </Card>
    </>
  );

  const footer = <SectionFormFooter onSaveDraft={save} onSubmit={submit} />;

  return { content, footer };
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {value ? <CheckSquare2 size={22} color={colors.green} /> : <Square size={22} color={colors.muted} />}
      <Text style={[styles.toggleText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
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
  toggleRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  toggleText: {
    ...typography.bodyMedium,
    flex: 1,
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
