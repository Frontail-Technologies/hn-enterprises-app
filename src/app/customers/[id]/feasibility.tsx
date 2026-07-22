import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { RequiredLabel } from '@/components/shared/RequiredLabel';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { TaskFormHeader } from '@/components/shared/TaskFormHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { getCustomerById } from '@/services/mockData';

const feasibleOptions = ['Feasible', 'Not Feasible', 'Needs Revisit'] as const;

export default function FeasibilityTaskScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const customer = getCustomerById(params.id ?? '');
  const [feasibilityDate, setFeasibilityDate] = useState('16-07-2026');
  const [feasibleStatus, setFeasibleStatus] = useState<(typeof feasibleOptions)[number]>('Feasible');
  const [proposedInstallationDate, setProposedInstallationDate] = useState('18-07-2026');
  const [remarks, setRemarks] = useState(customer?.survey.obstaclesRemarks ?? '');
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();

  if (!customer) {
    return (
      <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader title="Feasibility" left={<BackButton />} />
        <View style={styles.emptyState}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>Customer not found</Text>
          <Button label="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const submit = () => {
    showToast('Feasibility submitted', 'success');
    router.back();
  };
  const saveDraft = () => {
    showToast('Feasibility draft saved', 'success');
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={<SectionFormFooter onSaveDraft={saveDraft} onSubmit={submit} submitLabel="Submit" />}
    >
      <AppHeader
        title="Feasibility"
        subtitle={customer.customerConnection.trBpNo}
        left={<BackButton />}
      />

      <TaskFormHeader
        customer={customer}
        taskTitle="LMC Feasibility"
        taskSubtitle="Confirm site feasibility before installation."
      />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Feasibility Details</Text>
        <View style={styles.fieldStack}>
          <DateField label="Assigned Date" value={customer.survey.surveyDate} editable={false} />
          <DateField
            label="Date of Feasibility"
            value={feasibilityDate}
            onChangeText={setFeasibilityDate}
          />
          <View style={styles.fieldGroup}>
            <RequiredLabel label="Is Feasible?" required />
            <View style={styles.optionGrid}>
              {feasibleOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setFeasibleStatus(option)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: feasibleStatus === option ? colors.softOrange : colors.card,
                      borderColor: feasibleStatus === option ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {feasibleStatus === option ? <CheckCircle2 size={16} color={colors.primary} /> : null}
                  <Text
                    style={[
                      styles.optionText,
                      { color: feasibleStatus === option ? colors.primary : colors.text },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <DateField
            label="Proposed Installation Date"
            value={proposedInstallationDate}
            onChangeText={setProposedInstallationDate}
          />
          <View style={styles.fieldGroup}>
            <RequiredLabel label="Remarks" />
            <TextInput
              ref={remarksRef}
              onFocus={remarksOnFocus}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              placeholder="Add feasibility remarks..."
              placeholderTextColor={colors.muted}
              style={[
                styles.remarksInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              textAlignVertical="top"
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerAction}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 128,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  formCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  fieldStack: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    ...typography.label,
  },
  remarksInput: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
