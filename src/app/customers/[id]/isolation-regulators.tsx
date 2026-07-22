import { router, useLocalSearchParams } from 'expo-router';
import { Text, StyleSheet } from 'react-native';

import { useIsolationRegulatorsPanel } from '@/components/customer-sections/IsolationRegulatorsPanel';
import { CustomerSectionHeader } from '@/components/shared/CustomerSectionHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { getCustomerById } from '@/services/mockData';
import type { CustomerRecord } from '@/services/mockData';

export default function IsolationRegulatorsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customer = getCustomerById(params.id ?? '');

  if (!customer) return <MissingCustomer />;

  return <IsolationRegulatorsScreenContent customer={customer} />;
}

function IsolationRegulatorsScreenContent({ customer }: { customer: CustomerRecord }) {
  const { content, footer } = useIsolationRegulatorsPanel(customer);

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen} bottomAccessory={footer}>
      <CustomerSectionHeader title="Isolation & Regulators" customer={customer} />
      {content}
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
    paddingBottom: 128,
  },
});
