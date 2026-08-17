import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { QuantityFieldRow } from '@/components/shared/QuantityFieldRow';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useUpdateMdpeFittingsMutation } from '@/queries';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomerRecord } from '@/services/mockData';

const mdpeFields = [
  ['saddle90To32Mm', 'Saddle 90-32 mm'],
  ['saddle63To32Mm', 'Saddle 63-32 mm'],
  ['saddle32To20Mm', 'Saddle 32-20 mm'],
  ['tee90Mm', 'Tee 90 mm'],
  ['tee32Mm', 'Tee 32 mm'],
  ['tee20Mm', 'Tee 20 mm'],
  ['reducerCoupler90To63Mm', 'Reducer Coupler 90-63 mm'],
  ['reducerCoupler63To32Mm', 'Reducer Coupler 63-32 mm'],
  ['reducerCoupler32To20Mm', 'Reducer Coupler 32-20 mm'],
  ['coupler90Mm', 'Coupler 90 mm'],
  ['coupler32Mm', 'Coupler 32 mm'],
  ['coupler20Mm', 'Coupler 20 mm'],
  ['endCap90Mm', 'End Cap 90 mm'],
] as const;

export function useMdpeFittingsPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateMdpeFittingsMutation = useUpdateMdpeFittingsMutation(customer.id);
  const { values, updateField, clearDraft, draftState } = useDraftForm(
    `customer:${customer.id}:mdpe`,
    customer.mdpeFittings ?? {
      saddle90To32Mm: '',
      saddle63To32Mm: '',
      saddle32To20Mm: '',
      tee90Mm: '',
      tee32Mm: '',
      tee20Mm: '',
      reducerCoupler90To63Mm: '',
      reducerCoupler63To32Mm: '',
      reducerCoupler32To20Mm: '',
      coupler90Mm: '',
      coupler32Mm: '',
      coupler20Mm: '',
      endCap90Mm: '',
    },
  );

  const submit = async () => {
    try {
      await updateMdpeFittingsMutation.mutateAsync(values);
      await clearDraft();
      await onRefetch?.();
      showToast('MDPE fittings submitted', 'success');
      router.back();
    } catch (error) {
      console.error('[MdpeFittingsPanel] submit failed', { customerId: customer.id, error });
      const message = normalizeError(error, 'Unable to submit MDPE fittings');
      showToast(message, 'error');
    }
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fitting Quantities</Text>
        {mdpeFields.map(([key, label]) => (
          <QuantityFieldRow
            key={key}
            label={label}
            value={values[key]}
            onChangeText={(value) => updateField(key, value)}
          />
        ))}
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter onSubmit={submit} isSubmitting={updateMdpeFittingsMutation.isPending} />
  );

  return { content, footer };
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
});
