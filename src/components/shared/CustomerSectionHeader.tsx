import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { CustomerRecord } from '@/services/mockData';
import { formatDate } from '@/utils/format';

type CustomerSectionHeaderProps = {
  title: string;
  customer: CustomerRecord;
};

export function CustomerSectionHeader({ title, customer }: CustomerSectionHeaderProps) {
  const { colors } = useTheme();
  const connection = customer.customerConnection;

  return (
    <>
      <AppHeader
        title={title}
        subtitle={connection.trBpNo}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />
      <Card style={styles.detailsCard}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Customer Details</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.rows}>
          <DetailRow label="Name" value={connection.customerName} />
          <DetailRow label="BP/TR No" value={connection.trBpNo} />
          <DetailRow label="Mobile" value={connection.mobileNo} />
          <DetailRow label="Site" value={customer.siteArea} />
          <DetailRow label="Division" value={customer.projectName} />
          <DetailRow label="Created On" value={formatDate(customer.createdDate)} />
          <DetailRow label="Supervisor" value={connection.supervisorName} />
        </View>
      </Card>
    </>
  );
}

CustomerSectionHeader.displayName = 'CustomerSectionHeader';
CustomerSectionHeader.isStickyHeader = true;

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.separator, { color: colors.muted }]}>:</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value || '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
  },
  rows: {
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...typography.caption,
    width: 76,
    fontSize: 10,
    lineHeight: 14,
  },
  separator: {
    ...typography.caption,
    width: 7,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
  },
  value: {
    ...typography.label,
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
});
