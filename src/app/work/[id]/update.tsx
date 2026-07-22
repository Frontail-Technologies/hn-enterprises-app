import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle2, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { KeyValueSection } from '@/components/shared/KeyValueSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Screen } from '@/components/ui/Screen';
import { StickyFooter } from '@/components/shared/StickyFooter';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { getWorkProgressById, type WorkProgressStatus } from '@/services/mockData';

const editableStatuses: WorkProgressStatus[] = ['Pending', 'In Progress', 'Completed', 'Sent Back', 'On Hold'];

export default function WorkProgressUpdateScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const record = getWorkProgressById(params.id ?? '');
  const [status, setStatus] = useState<WorkProgressStatus>(record?.status ?? 'In Progress');
  const [workDate, setWorkDate] = useState('Today');
  const [remarks, setRemarks] = useState(
    params.mode === 'evidence' ? 'Evidence uploaded from field visit.' : '',
  );
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();

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

  const handleSubmit = () => {
    showToast(record.status === 'Sent Back' ? 'Work update resubmitted' : 'Work progress submitted', 'success');
    router.back();
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
            onPress={handleSubmit}
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
          <Text style={[typography.caption, { color: colors.text }]}>{record.nextRequiredAction}</Text>
        </View>
      </Card>

      <KeyValueSection
        title="Work Context"
        items={[
          { label: 'Project', value: record.projectName },
          { label: 'Current Stage', value: record.currentStage },
          { label: 'Expected Next', value: record.expectedNextStage },
          { label: 'Stage Date', value: record.stageDate },
          { label: 'Updated By', value: record.updatedBy },
        ]}
      />

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
        <DateField label="Work Date" value={workDate} onChangeText={setWorkDate} />
      </Card>

      <Card style={styles.sectionCard}>
        <EvidenceUploader title="Evidence / Photos" />
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
  dateBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  remarksInput: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
