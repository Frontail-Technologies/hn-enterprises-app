import { ArrowRight, CalendarClock, Camera } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { WorkProgressRecord } from '@/services/mockData';

type StageStatusCardProps = {
  record: WorkProgressRecord;
};

export function StageStatusCard({ record }: StageStatusCardProps) {
  const { colors } = useTheme();

  return (
    <Card elevated style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.softBlue }]}>
          <ArrowRight size={20} color={colors.accent} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.stage, { color: colors.text }]}>{record.currentStage}</Text>
          <Text style={[typography.caption, { color: colors.muted }]}>Next: {record.expectedNextStage}</Text>
        </View>
        <StatusBadge status={record.status} />
      </View>

      <View style={[styles.actionBox, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[typography.label, { color: colors.muted }]}>Next Required Action</Text>
        <Text style={[styles.actionText, { color: colors.text }]}>{record.nextRequiredAction}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <CalendarClock size={15} color={colors.primary} />
          <Text style={[typography.label, { color: colors.text }]}>{record.stageDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Camera size={15} color={colors.accent} />
          <Text style={[typography.label, { color: colors.text }]}>{record.evidenceCount} evidence</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  titleWrap: {
    flex: 1,
    gap: 1,
  },
  stage: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  actionBox: {
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  actionText: {
    ...typography.caption,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
