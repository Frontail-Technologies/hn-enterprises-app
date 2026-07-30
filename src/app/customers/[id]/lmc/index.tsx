import { router, useLocalSearchParams } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

import { useLmcPipelinePanel } from '@/components/customer-sections/LmcPipelinePanel';
import { CustomerSectionHeader } from '@/components/shared/CustomerSectionHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useCustomerRecord } from '@/hooks/useCustomerRecord';
import type { CustomerRecord } from '@/services/mockData';

export default function LmcPipeListScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { customer, isLoading, error, refetch } = useCustomerRecord(params.id);

  if (isLoading) return <LoadingCustomer />;
  if (error || !customer) return <MissingCustomer />;

  return <LmcPipeListScreenContent customer={customer} onRefetch={refetch} />;
}

function LmcPipeListScreenContent({
  customer,
  onRefetch,
}: {
  customer: CustomerRecord;
  onRefetch: () => Promise<void>;
}) {
  const { content } = useLmcPipelinePanel(customer, onRefetch);

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <CustomerSectionHeader title="LMC Pipeline" customer={customer} />
      {content}
    </Screen>
  );
}

function LoadingCustomer() {
  const { colors } = useTheme();
  return (
    <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <Text style={[typography.bodyMedium, { color: colors.text }]}>Loading...</Text>
    </Screen>
  );
}

function MissingCustomer() {
  const { colors } = useTheme();
  return (
    <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <Text style={[typography.bodyMedium, { color: colors.text }]}>Customer not found</Text>
      <Button label="Go Back" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 104,
  },
});
