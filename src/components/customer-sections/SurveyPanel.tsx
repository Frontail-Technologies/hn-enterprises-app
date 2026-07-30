import { router } from 'expo-router';
import { AlertCircle, CheckCircle2, MapPin, XCircle } from 'lucide-react-native';
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
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { customersService } from '@/services/customers.service';
import type { CustomerRecord } from '@/services/mockData';

const workableOptions = ['Workable', 'Partially Workable', 'Not Workable'] as const;

export function useSurveyPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { location, captureLocation, loading } = useCurrentLocation();
  const survey = customer.survey ?? {
    surveyId: '',
    surveyDate: '',
    assignedSurveyor: '',
    workableStatus: 'Workable' as const,
    approvalStatus: 'Draft' as const,
    initialMeasurements: '',
    obstaclesRemarks: '',
    gpsLocation: '',
    photos: [],
  };
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:survey`, {
    surveyDate: survey.surveyDate,
    assignedSurveyor: survey.assignedSurveyor,
    gpsLocation: survey.gpsLocation,
    workableStatus: survey.workableStatus,
    initialMeasurements: survey.initialMeasurements,
    siteAccessibility: survey.siteAccessibility ?? '',
    meterPlacement: survey.meterPlacement ?? '',
    pipelineRoute: survey.pipelineRoute ?? '',
    civilWorkRequired: survey.civilWorkRequired ?? '',
    obstaclesRemarks: survey.obstaclesRemarks,
    notes: survey.notes ?? '',
    reason: survey.reason ?? '',
    recommendedAction: survey.recommendedAction ?? '',
    expectedResolutionDate: survey.expectedResolutionDate ?? '',
  });
  const { ref: obstaclesRef, onFocus: obstaclesOnFocus } = useScrollIntoViewOnFocus();

  const submit = async () => {
    try {
      await customersService.updateSurvey(customer.id, {
        ...survey,
        ...values,
      });
      await clearDraft();
      await onRefetch?.();
      showToast(survey.approvalStatus === 'Sent Back' ? 'Survey resubmitted' : 'Survey submitted', 'success');
      router.back();
    } catch {
      showToast('Unable to submit survey', 'error');
    }
  };

  const save = async () => {
    await saveDraft();
    showToast('Survey draft saved', 'success');
  };

  const captureGps = async () => {
    const nextLocation = await captureLocation();
    if (nextLocation) {
      updateField('gpsLocation', `${nextLocation.latitude.toFixed(5)}, ${nextLocation.longitude.toFixed(5)}`);
    }
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      {survey.sentBackRemarks ? (
        <Card style={styles.noticeCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sent-back Remarks</Text>
          <Text style={[typography.body, { color: colors.muted }]}>{survey.sentBackRemarks}</Text>
        </Card>
      ) : null}

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Survey Details</Text>
        <Input label="Survey ID" value={survey.surveyId} editable={false} />
        <DateField label="Survey Date" value={values.surveyDate} onChangeText={(value) => updateField('surveyDate', value)} />
        <Input
          label="Assigned Surveyor"
          value={values.assignedSurveyor}
          onChangeText={(value) => updateField('assignedSurveyor', value)}
        />
        <View style={styles.locationRow}>
          <View style={styles.locationInput}>
            <Input
              label="GPS / Location"
              value={location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : values.gpsLocation}
              onChangeText={(value) => updateField('gpsLocation', value)}
            />
          </View>
          <Pressable
            onPress={captureGps}
            style={[styles.locationButton, { backgroundColor: colors.softOrange, borderColor: colors.primary }]}
          >
            <MapPin size={18} color={colors.primary} />
            <Text style={[styles.locationButtonText, { color: colors.primary }]}>
              {loading ? 'Capturing' : 'Capture'}
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Workable Assessment</Text>
        <View style={styles.optionGrid}>
          {workableOptions.map((option) => (
            <Pressable
              key={option}
              onPress={() => updateField('workableStatus', option)}
              style={[
                styles.workableCard,
                {
                  backgroundColor: getWorkableTone(option).background,
                  borderColor: values.workableStatus === option ? getWorkableTone(option).color : colors.border,
                },
              ]}
            >
              <WorkableIcon option={option} active={values.workableStatus === option} />
              <Text style={[styles.optionText, { color: getWorkableTone(option).color }]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input
          label="Reason"
          value={values.reason}
          onChangeText={(value) => updateField('reason', value)}
        />
        <Input
          label="Recommended Action"
          value={values.recommendedAction}
          onChangeText={(value) => updateField('recommendedAction', value)}
        />
        <DateField
          label="Expected Resolution Date"
          value={values.expectedResolutionDate}
          onChangeText={(value) => updateField('expectedResolutionDate', value)}
        />
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Site Conditions</Text>
        <Input
          label="Initial Measurements"
          value={values.initialMeasurements}
          onChangeText={(value) => updateField('initialMeasurements', value)}
        />
        <Input
          label="Site Accessibility"
          value={values.siteAccessibility}
          onChangeText={(value) => updateField('siteAccessibility', value)}
        />
        <Input
          label="Meter Placement"
          value={values.meterPlacement}
          onChangeText={(value) => updateField('meterPlacement', value)}
        />
        <Input
          label="Pipeline Route"
          value={values.pipelineRoute}
          onChangeText={(value) => updateField('pipelineRoute', value)}
        />
        <Input
          label="Civil Work Required"
          value={values.civilWorkRequired}
          onChangeText={(value) => updateField('civilWorkRequired', value)}
        />
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Obstacles / Remarks" />
          <TextInput
            ref={obstaclesRef}
            onFocus={obstaclesOnFocus}
            value={values.obstaclesRemarks}
            onChangeText={(value) => updateField('obstaclesRemarks', value)}
            multiline
            placeholder="Add obstacles or remarks..."
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            textAlignVertical="top"
          />
        </View>
        <Input label="Notes" value={values.notes} onChangeText={(value) => updateField('notes', value)} />
      </Card>

      <Card style={styles.formCard}>
        <EvidenceUploader title="Site Photos" initialFiles={survey.evidence} />
      </Card>

    </>
  );

  const footer = (
    <SectionFormFooter
      onSaveDraft={save}
      onSubmit={submit}
      submitLabel={survey.approvalStatus === 'Sent Back' ? 'Resubmit' : 'Submit'}
    />
  );

  return { content, footer };
}

function WorkableIcon({ option, active }: { option: (typeof workableOptions)[number]; active: boolean }) {
  const tone = getWorkableTone(option);
  const size = active ? 18 : 16;

  if (option === 'Workable') return <CheckCircle2 size={size} color={tone.color} />;
  if (option === 'Partially Workable') return <AlertCircle size={size} color={tone.color} />;
  return <XCircle size={size} color={tone.color} />;
}

function getWorkableTone(option: (typeof workableOptions)[number]) {
  if (option === 'Workable') return { color: '#16A34A', background: '#F0FDF4' };
  if (option === 'Partially Workable') return { color: '#EA580C', background: '#FFF7ED' };
  return { color: '#DC2626', background: '#FEF2F2' };
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  noticeCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },
  locationButtonText: {
    ...typography.label,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  workableCard: {
    flex: 1,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  optionText: {
    ...typography.label,
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
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
