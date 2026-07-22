import { MapPin, UserRound } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { CustomerRecord } from '@/services/mockData';

type TaskFormHeaderProps = {
  customer: CustomerRecord;
  taskTitle: string;
  taskSubtitle?: string;
};

export function TaskFormHeader({ customer, taskTitle, taskSubtitle }: TaskFormHeaderProps) {
  const { colors } = useTheme();
  const connection = customer.customerConnection;

  return (
    <Card elevated style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: colors.softOrange }]}>
          <UserRound size={22} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{taskTitle}</Text>
          {taskSubtitle ? (
            <Text style={[typography.label, { color: colors.muted }]}>{taskSubtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.referenceGrid}>
        <Reference label="Customer" value={connection.customerName} />
        <Reference label="BP / TR" value={connection.trBpNo} />
        <Reference label="Mobile" value={connection.mobileNo} />
        <Reference label="Site" value={customer.siteArea} />
      </View>

      <View style={styles.locationRow}>
        <MapPin size={14} color={colors.muted} />
        <Text style={[typography.label, styles.locationText, { color: colors.muted }]} numberOfLines={1}>
          {customer.projectName} : {customer.city}
        </Text>
      </View>
    </Card>
  );
}

function Reference({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.referenceItem}>
      <Text style={[typography.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.referenceValue, { color: colors.text }]} numberOfLines={1}>
        {value || '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  taskTitle: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  referenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  referenceItem: {
    width: '47.8%',
    gap: 2,
  },
  referenceValue: {
    ...typography.caption,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    flex: 1,
  },
});
