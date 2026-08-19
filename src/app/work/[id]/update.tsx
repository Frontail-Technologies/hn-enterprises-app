import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, ListChecks, Upload } from 'lucide-react-native';
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
import { editableWorkProgressStatuses } from '@/constants/workProgress';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useCustomerRecord } from '@/hooks/useCustomerRecord';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { useWorkProgressUpdateForm } from '@/hooks/useWorkProgressUpdateForm';
import { useWorkProgressHistoryQuery } from '@/queries';
import { WORK_STAGE_ORDER, adaptCustomerForWorkDetail, buildDetailRecord, isSentBack } from '@/services/workProgress.service';

export default function WorkProgressUpdateScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const customerId = params.id ?? '';
  const { customer, isLoading: customerLoading, error: customerError, refetch: refetchCustomer } = useCustomerRecord(customerId);
  const {
    data: history = [],
    isLoading: historyLoading,
    isError: historyIsError,
    refetch: refetchHistory,
  } = useWorkProgressHistoryQuery(customerId);
  const latest = history[0];
  const record = customer ? buildDetailRecord(adaptCustomerForWorkDetail(customer), latest) : null;

  if (customerLoading || historyLoading) {
    return (
      <Screen edges={['bottom']} contentStyle={styles.screen}>
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

  if (customerError || historyIsError) {
    return (
      <Screen edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader
          title="Update Work"
          left={
            <Pressable onPress={() => router.back()} style={styles.headerAction}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </Pressable>
          }
        />
        <View style={styles.emptyState}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>Couldn&apos;t load this record</Text>
          <Text style={[typography.caption, { color: colors.muted }]}>Check your connection and try again.</Text>
          <Button
            label="Retry"
            onPress={() => {
              void refetchCustomer();
              void refetchHistory();
            }}
          />
        </View>
      </Screen>
    );
  }

  if (!record) {
    return (
      <Screen edges={['bottom']} contentStyle={styles.screen}>
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
  const {
    stage,
    setStage,
    status,
    setStatus,
    nextRequiredAction,
    setNextRequiredAction,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    isSubmitting,
    handleSubmit,
  } = useWorkProgressUpdateForm({ customerId, mode, record });
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();
  const { ref: actionRef, onFocus: actionOnFocus } = useScrollIntoViewOnFocus();

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={
        <StickyFooter>
          <Button
            label={isSentBack(record.status) ? 'Resubmit Update' : 'Submit Update'}
            icon={<Upload size={18} color="#FFFFFF" />}
            onPress={() => void handleSubmit()}
            loading={isSubmitting}
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
        <View style={[styles.nextAction, { backgroundColor: colors.surfaceMuted }]}>
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
                  backgroundColor: stage === item ? colors.accentSoft : colors.surfaceMuted,
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
          {editableWorkProgressStatuses.map((item) => (
            <Pressable
              key={item}
              onPress={() => setStatus(item)}
              style={[
                styles.statusChip,
                {
                  backgroundColor: status === item ? colors.accentSoft : colors.surfaceMuted,
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
              backgroundColor: colors.surfaceMuted,
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
              backgroundColor: colors.surfaceMuted,
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
