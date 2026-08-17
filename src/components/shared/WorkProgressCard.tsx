import { router } from 'expo-router';
import { ArrowRight, CalendarClock, Camera, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import type { WorkProgressRecord } from '@/services/mockData';

type WorkProgressCardProps = {
  record: WorkProgressRecord;
};

export function WorkProgressCard({ record }: WorkProgressCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() =>
        guardNavigation(() =>
          router.push({
            pathname: '/work/[id]',
            params: { id: record.id },
          }),
        )
      }
      style={({ pressed }) => [pressed && { opacity: 0.84 }]}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <Text style={[styles.customerName, { color: colors.text }]}>{record.customerName}</Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              {record.bpTrNumber} : {record.currentStage}
            </Text>
          </View>
          <StatusBadge status={record.status} />
        </View>

        <View style={[styles.referenceBox, { backgroundColor: colors.surfaceMuted }]}>
          <View style={styles.referenceRow}>
            <MapPin size={15} color={colors.accent} />
            <Text style={[typography.caption, styles.referenceText, { color: colors.text }]} numberOfLines={1}>
              {record.projectName} : {record.siteArea}
            </Text>
          </View>
          <View style={styles.referenceRow}>
            <CalendarClock size={15} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.muted }]}>
              {record.stageDate} : {record.ageDays} days
            </Text>
          </View>
          <View style={styles.referenceRow}>
            <Camera size={15} color={colors.accent} />
            <Text style={[typography.caption, { color: colors.muted }]}>{record.evidenceCount} evidence files</Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.nextAction, { color: colors.text }]} numberOfLines={1}>
            {record.nextRequiredAction}
          </Text>
          <ArrowRight size={17} color={colors.primary} />
        </View>
      </Card>
    </Pressable>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
    gap: 1,
  },
  customerName: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  referenceBox: {
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  referenceText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  nextAction: {
    ...typography.caption,
    flex: 1,
  },
});
