import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock3, FileText, MapPin, Upload } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { KeyValueSection } from '@/components/shared/KeyValueSection';
import { StageStatusCard } from '@/components/shared/StageStatusCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { getWorkProgressById } from '@/services/mockData';

export default function WorkProgressDetailScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const record = getWorkProgressById(params.id ?? '');

  if (!record) {
    return (
      <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader
          title="Work Detail"
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

  const isSentBack = record.status === 'Sent Back';

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader
        title={record.currentStage}
        subtitle={`${record.customerName} : ${record.bpTrNumber}`}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <Card elevated style={styles.customerCard}>
        <View style={styles.customerTop}>
          <View style={[styles.customerIcon, { backgroundColor: colors.softOrange }]}>
            <FileText size={24} color={colors.primary} />
          </View>
          <View style={styles.customerCopy}>
            <Text style={[styles.customerName, { color: colors.text }]}>{record.customerName}</Text>
            <Text style={[typography.caption, { color: colors.muted }]}>{record.bpTrNumber}</Text>
          </View>
        </View>
        <View style={[styles.referenceBox, { backgroundColor: colors.background }]}>
          <InfoLine icon={<MapPin size={16} color={colors.accent} />} value={`${record.projectName} : ${record.siteArea}`} />
          <InfoLine icon={<Clock3 size={16} color={colors.primary} />} value={`${record.stageDate} : ${record.ageDays} days`} />
        </View>
      </Card>

      <StageStatusCard record={record} />

      {isSentBack ? (
        <Card style={[styles.noticeCard, { backgroundColor: colors.softOrange }]}>
          <Text style={[styles.noticeTitle, { color: colors.primary }]}>Sent Back</Text>
          <Text style={[typography.caption, { color: colors.text }]}>
            Review comments require corrected evidence before the next update.
          </Text>
        </Card>
      ) : null}

      <KeyValueSection
        title="Work Progress"
        items={[
          { label: 'Current Stage', value: record.currentStage },
          { label: 'Expected Next', value: record.expectedNextStage },
          { label: 'Next Action', value: record.nextRequiredAction },
          { label: 'Last Updated', value: record.lastUpdated },
          { label: 'Updated By', value: record.updatedBy },
          { label: 'Evidence Count', value: record.evidenceCount },
        ]}
      />

      <Card style={styles.sectionCard}>
        <EvidenceUploader />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Stage History</Text>
        <TimelineRow title="Stage opened" subtitle={`${record.updatedBy} : ${record.stageDate}`} />
        <TimelineRow title={record.nextRequiredAction} subtitle={`${record.supervisor} : latest field action`} />
      </Card>

      <Button
        label={isSentBack ? 'Resubmit Update' : 'Submit Progress Update'}
        icon={<Upload size={18} color="#FFFFFF" />}
        onPress={() =>
          router.push({
            pathname: '/work/[id]/update',
            params: { id: record.id },
          })
        }
      />
    </Screen>
  );
}

function InfoLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.infoLine}>
      {icon}
      <Text style={[typography.caption, styles.infoText, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function TimelineRow({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.timelineRow}>
      <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
      <View style={styles.timelineCopy}>
        <Text style={[styles.timelineTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.label, { color: colors.muted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 104,
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
  customerCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  customerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  customerIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  customerCopy: {
    flex: 1,
    gap: 1,
  },
  customerName: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  referenceBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  noticeCard: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  noticeTitle: {
    ...typography.caption,
  },
  sectionCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: 5,
  },
  timelineCopy: {
    flex: 1,
    gap: 1,
  },
  timelineTitle: {
    ...typography.caption,
  },
});
