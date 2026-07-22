import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { usePipeEditForm } from '@/components/customer-sections/LmcPipeEditForm';
import { CustomerSectionHeader } from '@/components/shared/CustomerSectionHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { getCustomerById } from '@/services/mockData';
import type { CustomerRecord } from '@/services/mockData';

export default function LmcPipeUpdateScreen() {
  const params = useLocalSearchParams<{ id?: string; pipeId?: string }>();
  const customer = getCustomerById(params.id ?? '');

  if (!customer) return <MissingPipe />;

  return <LmcPipeUpdateScreenContent customer={customer} pipeId={params.pipeId ?? ''} />;
}

function LmcPipeUpdateScreenContent({ customer, pipeId }: { customer: CustomerRecord; pipeId: string }) {
  const { pipe, content, footer } = usePipeEditForm(customer, pipeId);

  if (!pipe) return <MissingPipe />;

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen} bottomAccessory={footer}>
      <CustomerSectionHeader title={`${pipe.pipeSize} Pipe`} customer={customer} />
      {content}
    </Screen>
  );
}

function MissingPipe() {
  const { colors } = useTheme();
  return (
    <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <Text style={[typography.bodyMedium, { color: colors.text }]}>Pipe record not found</Text>
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
