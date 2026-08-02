import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, ListChecks, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { KeyValueSection } from '@/components/shared/KeyValueSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StickyFooter } from '@/components/shared/StickyFooter';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useCustomerRecord } from '@/hooks/useCustomerRecord';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { useWorkProgressHistory } from '@/hooks/useWorkProgress';
import type { EvidenceFile, WorkProgressStatus, WorkStage } from '@/services/mockData';
import {
  WORK_STAGE_ORDER,
  buildDetailRecord,
  toWorkProgressEvidence,
  workProgressApi,
} from '@/services/workProgress.service';

const editableStatuses: WorkProgressStatus[] = ['Pending', 'In Progress', 'Completed', 'Sent Back', 'On Hold'];

export default function WorkProgressUpdateScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const customerId = params.id ?? '';
  const { customer, isLoading: customerLoading } = useCustomerRecord(customerId);
  const { history, isLoading: historyLoading } = useWorkProgressHistory(customerId);
  const latest = history[0];
  const record = customer
    ? buildDetailRecord(
        {
          id: customer.id,
          customerName: customer.customerConnection.customerName,
          mobileNumber: customer.customerConnection.mobileNo,
          bpTrNumber: customer.customerConnection.trBpNo,
          siteArea: customer.siteArea,
          supervisor: customer.customerConnection.supervisorName,
        },
        latest,
      )
    : null;

  if (customerLoading || historyLoading) {
    return (
      <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader
          title="Update Work"
          left={
            <Pressable onPress={() => router.back()} style={styles.headerAction}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
          }
        />
        <View style={styles.emptyState}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (!record) {
    return (
      <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader
          title="Update Work"
          left={
            <Pressable onPress={() => router.back()} style={styles.headerAction}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
          }
        />
        <View style={styles.emptyState}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>Work record not found</Text>
          <Button label="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <WorkProgressUpdateForm customerId={customerId} mode={params.mode} record={record} />
  );
}

function WorkProgressUpdateForm({
  customerId,
  mode,
  record,
}: {
  customerId: string;
  mode?: string;
  record: ReturnType<typeof buildDetailRecord>;
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [stage, setStage] = useState<WorkStage>(record.currentStage);
  const [status, setStatus] = useState<WorkProgressStatus>(record.status === 'Not Started' ? 'In Progress' : record.status);
  const [nextRequiredAction, setNextRequiredAction] = useState(record.nextRequiredAction);
  const [remarks, setRemarks] = useState(mode === 'evidence' ? 'Evidence uploaded from field visit.' : '');
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();
  const { ref: actionRef, onFocus: actionOnFocus } = useScrollIntoViewOnFocus();

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await workProgressApi.createUpdate({
        customerId,
        stage,
        status,
        nextRequiredAction: nextRequiredAction.trim() || undefined,
        remarks: remarks.trim() || undefined,
        evidence: toWorkProgressEvidence(evidence),
      });
      showToast(record.status === 'Sent Back' ? 'Work update resubmitted' : 'Work progress submitted', 'success');
      router.back();
    } catch {
      showToast('Unable to submit work update', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={
        <StickyFooter>
          <Button
            label={record.status === 'Sent Back' ? 'Resubmit Update' : 'Submit Update'}
            icon={<Upload size={18} color="#FFFFFF" />}
            onPress={() => void handleSubmit()}
            disabled={submitting}
          />
        </StickyFooter>
      }
    >
      <AppHeader
        title="Update Work"
        subtitle={`${record.customerName} : ${record.currentStage}`}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <Card elevated style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={styles.summaryCopy}>
            <Text style={[styles.customerName, { color: colors.text }]}>{record.customerName}</Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              {record.bpTrNumber} : {record.siteArea}
            </Text>
          </View>
          <StatusBadge status={record.status} />
        </View>
        <View style={[styles.nextAction, { backgroundColor: colors.background }]}>
          <Text style={[typography.label, { color: colors.muted }]}>Next Required Action</Text>
          <Text style={[typography.caption, { color: colors.text }]}>{record.nextRequiredAction || '-'}</Text>
        </View>
      </Card>

      <KeyValueSection
        title="Work Context"
        items={[
          { label: 'Project', value: record.projectName },
          { label: 'Current Stage', value: record.currentStage },
          { label: 'Stage Date', value: record.stageDate },
          { label: 'Updated By', value: record.updatedBy },
        ]}
      />

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <ListChecks size={19} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Stage</Text>
        </View>
        <View style={styles.statusGrid}>
          {WORK_STAGE_ORDER.map((item) => (
            <Pressable
              key={item}
              onPress={() => setStage(item)}
              style={[
                styles.statusChip,
                {
                  backgroundColor: stage === item ? colors.softOrange : colors.background,
                  borderColor: stage === item ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: stage === item ? colors.primary : colors.text }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <CheckCircle2 size={19} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Update Status</Text>
        </View>
        <View style={styles.statusGrid}>
          {editableStatuses.map((item) => (
            <Pressable
              key={item}
              onPress={() => setStatus(item)}
              style={[
                styles.statusChip,
                {
                  backgroundColor: status === item ? colors.softOrange : colors.background,
                  borderColor: status === item ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: status === item ? colors.primary : colors.text }]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Next Required Action</Text>
        <TextInput
          ref={actionRef}
          onFocus={actionOnFocus}
          value={nextRequiredAction}
          onChangeText={setNextRequiredAction}
          placeholder="e.g. Schedule conversion visit"
          placeholderTextColor={colors.muted}
          style={[
            styles.actionInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <EvidenceUploader title="Evidence / Photos" module="work" recordId={customerId} initialFiles={evidence} onChange={setEvidence} />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Supervisor Remarks</Text>
        <TextInput
          ref={remarksRef}
          onFocus={remarksOnFocus}
          value={remarks}
          onChangeText={setRemarks}
          multiline
          placeholder="Add field remarks..."
          placeholderTextColor={colors.muted}
          style={[
            styles.remarksInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          textAlignVertical="top"
        />
      </Card>
    </Screen>
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
  summaryCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryCopy: {
    flex: 1,
    gap: 1,
  },
  customerName: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  nextAction: {
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  statusText: {
    ...typography.label,
  },
  actionInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  remarksInput: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
