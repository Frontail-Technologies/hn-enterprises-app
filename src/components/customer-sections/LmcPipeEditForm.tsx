import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
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
import type { CustomerRecord, LmcLayingStatus, LmcPurgingStatus, LmcTestingStatus } from '@/services/mockData';

const layingOptions: LmcLayingStatus[] = ['Not Started', 'In Progress', 'Completed', 'Not Required', 'On Hold'];
const testingOptions: LmcTestingStatus[] = ['Pending', 'In Progress', 'Passed', 'Failed', 'Not Required', 'On Hold'];
const purgingOptions: LmcPurgingStatus[] = ['Pending', 'In Progress', 'Completed', 'Not Required', 'On Hold'];

export function usePipeEditForm(customer: CustomerRecord, pipeId: string, onDone?: () => void) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const pipe = customer.lmcPipelineWork.pipeRecords.find((item) => item.id === pipeId);
  const draftPipe = pipe ?? {
    id: pipeId,
    pipeSize: 'Other' as const,
    lengthMetres: '',
    layingDate: '',
    testingDate: '',
    purgingDate: '',
    layingStatus: 'Not Started' as const,
    testingStatus: 'Pending' as const,
    purgingStatus: 'Pending' as const,
    jointFittingDetails: '',
    remarks: '',
    evidence: [],
  };

  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:pipe:${draftPipe.id}`, {
    lengthMetres: draftPipe.lengthMetres,
    layingDate: draftPipe.layingDate,
    testingDate: draftPipe.testingDate,
    purgingDate: draftPipe.purgingDate,
    layingStatus: draftPipe.layingStatus,
    testingStatus: draftPipe.testingStatus,
    purgingStatus: draftPipe.purgingStatus,
    jointFittingDetails: draftPipe.jointFittingDetails,
    remarks: draftPipe.remarks,
  });
  const { ref: jointFittingRef, onFocus: jointFittingOnFocus } = useScrollIntoViewOnFocus();
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();

  const save = async () => {
    await saveDraft();
    showToast(`${draftPipe.pipeSize} pipe draft saved`, 'success');
  };
  const submit = async () => {
    await clearDraft();
    showToast(`${draftPipe.pipeSize} pipe update submitted`, 'success');
    if (onDone) onDone();
    else router.back();
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pipe Details</Text>
        <Input label="Length / Quantity" value={values.lengthMetres} onChangeText={(value) => updateField('lengthMetres', value)} keyboardType="decimal-pad" />
        <DateField label="Laying Date" value={values.layingDate} onChangeText={(value) => updateField('layingDate', value)} />
        <DateField label="Testing Date" value={values.testingDate} onChangeText={(value) => updateField('testingDate', value)} />
        <DateField label="Purging Date" value={values.purgingDate} onChangeText={(value) => updateField('purgingDate', value)} />
      </Card>

      <Card style={styles.formCard}>
        <StatusChooser title="Laying Status" options={layingOptions} value={values.layingStatus} onChange={(value) => updateField('layingStatus', value)} />
        <StatusChooser title="Testing Status" options={testingOptions} value={values.testingStatus} onChange={(value) => updateField('testingStatus', value)} />
        <StatusChooser title="Purging Status" options={purgingOptions} value={values.purgingStatus} onChange={(value) => updateField('purgingStatus', value)} />
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Joint / Fitting Details" />
          <TextInput
            ref={jointFittingRef}
            onFocus={jointFittingOnFocus}
            value={values.jointFittingDetails}
            onChangeText={(value) => updateField('jointFittingDetails', value)}
            multiline
            placeholder="Add joint or fitting details..."
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            textAlignVertical="top"
          />
        </View>
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Remarks" />
          <TextInput
            ref={remarksRef}
            onFocus={remarksOnFocus}
            value={values.remarks}
            onChangeText={(value) => updateField('remarks', value)}
            multiline
            placeholder="Add pipe remarks..."
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            textAlignVertical="top"
          />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <EvidenceUploader title={`${draftPipe.pipeSize} Evidence`} initialFiles={draftPipe.evidence} />
      </Card>
    </>
  );

  const footer = <SectionFormFooter onSaveDraft={save} onSubmit={submit} />;

  return { pipe, content, footer };
}

function StatusChooser<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.statusGroup}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.optionGrid}>
        {options.map((option) => (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.optionChip,
              {
                backgroundColor: value === option ? colors.softOrange : colors.card,
                borderColor: value === option ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.optionText, { color: value === option ? colors.primary : colors.text }]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
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
  statusGroup: {
    gap: spacing.sm,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    ...typography.label,
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
