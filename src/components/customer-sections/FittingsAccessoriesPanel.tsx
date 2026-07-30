import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { QuantityFieldRow } from '@/components/shared/QuantityFieldRow';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { customersService } from '@/services/customers.service';
import type { CustomerRecord } from '@/services/mockData';

const groups = [
  { key: 'clamps', label: 'Clamps & Elbows' },
  { key: 'nipples', label: 'Nipples & Sockets' },
  { key: 'reducers', label: 'Reducers & Other' },
] as const;

export function useFittingsAccessoriesPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [activeGroup, setActiveGroup] = useState<(typeof groups)[number]['key']>('clamps');
  const fallback = customer.fittingsAccessories ?? {
    clampHalfInch: customer.isolationFittings.clampHalfInch ?? '',
    clampThreeInchToHalfInch: '0',
    elbowHalfInch: customer.isolationFittings.elbowHalfInch ?? '',
    mfElbowHalfInch: '0',
    socketHalfInch: '0',
    teeHalfInch: customer.isolationFittings.teeHalfInch ?? '',
    nippleTwoInch: '0',
    nippleThreeInch: '0',
    nippleFourInch: '0',
    reducerElbowThreeQuarterToHalfInch: '0',
    threeQuarterInchToThreeInch: '0',
    unionHalfInch: '0',
    plugHalfInch: '0',
    fittingsOneAndHalfInch: '0',
    fittingsTwoInch: '0',
    remarks: '',
    evidence: [],
  };
  const { values, updateField, saveDraft, clearDraft, draftState } = useDraftForm(`customer:${customer.id}:fittings`, fallback);

  const save = async () => {
    await saveDraft();
    showToast('Fittings draft saved', 'success');
  };
  const submit = async () => {
    try {
      await customersService.updateFittingsAccessories(customer.id, {
        clampHalfInch: values.clampHalfInch,
        clampThreeInchToHalfInch: values.clampThreeInchToHalfInch,
        elbowHalfInch: values.elbowHalfInch,
        mfElbowHalfInch: values.mfElbowHalfInch,
        socketHalfInch: values.socketHalfInch,
        teeHalfInch: values.teeHalfInch,
        nippleTwoInch: values.nippleTwoInch,
        nippleThreeInch: values.nippleThreeInch,
        nippleFourInch: values.nippleFourInch,
        reducerElbowThreeQuarterToHalfInch: values.reducerElbowThreeQuarterToHalfInch,
        threeQuarterInchToThreeInch: values.threeQuarterInchToThreeInch,
        unionHalfInch: values.unionHalfInch,
        plugHalfInch: values.plugHalfInch,
        fittingsOneAndHalfInch: values.fittingsOneAndHalfInch,
        fittingsTwoInch: values.fittingsTwoInch,
      });
      await clearDraft();
      await onRefetch?.();
      showToast('Fittings submitted', 'success');
      router.back();
    } catch {
      showToast('Unable to submit fittings', 'error');
    }
  };

  const content = (
    <>
      <FormStateBanner state={draftState} />

      <View style={styles.groupTabs}>
        {groups.map((group) => (
          <Pressable
            key={group.key}
            onPress={() => setActiveGroup(group.key)}
            style={[
              styles.groupTab,
              {
                backgroundColor: activeGroup === group.key ? colors.softOrange : colors.card,
                borderColor: activeGroup === group.key ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.groupText, { color: activeGroup === group.key ? colors.primary : colors.text }]}>
              {group.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {groups.find((group) => group.key === activeGroup)?.label}
        </Text>
        {activeGroup === 'clamps' ? (
          <>
            <QuantityFieldRow label="Clamp 1/2 inch" value={values.clampHalfInch} onChangeText={(value) => updateField('clampHalfInch', value)} />
            <QuantityFieldRow label="Clamp 3 inch to 1/2 inch" value={values.clampThreeInchToHalfInch} onChangeText={(value) => updateField('clampThreeInchToHalfInch', value)} />
            <QuantityFieldRow label="Elbow 1/2 inch" value={values.elbowHalfInch} onChangeText={(value) => updateField('elbowHalfInch', value)} />
            <QuantityFieldRow label="M/F Elbow 1/2 inch" value={values.mfElbowHalfInch} onChangeText={(value) => updateField('mfElbowHalfInch', value)} />
            <QuantityFieldRow label="Tee 1/2 inch" value={values.teeHalfInch} onChangeText={(value) => updateField('teeHalfInch', value)} />
          </>
        ) : null}
        {activeGroup === 'nipples' ? (
          <>
            <QuantityFieldRow label="Socket 1/2 inch" value={values.socketHalfInch} onChangeText={(value) => updateField('socketHalfInch', value)} />
            <QuantityFieldRow label="Nipple 2 inch" value={values.nippleTwoInch} onChangeText={(value) => updateField('nippleTwoInch', value)} />
            <QuantityFieldRow label="Nipple 3 inch" value={values.nippleThreeInch} onChangeText={(value) => updateField('nippleThreeInch', value)} />
            <QuantityFieldRow label="Nipple 4 inch" value={values.nippleFourInch} onChangeText={(value) => updateField('nippleFourInch', value)} />
          </>
        ) : null}
        {activeGroup === 'reducers' ? (
          <>
            <QuantityFieldRow label="Reducer Elbow 3/4 to 1/2 inch" value={values.reducerElbowThreeQuarterToHalfInch} onChangeText={(value) => updateField('reducerElbowThreeQuarterToHalfInch', value)} />
            <QuantityFieldRow label="3/4 inch to 3 inch" value={values.threeQuarterInchToThreeInch} onChangeText={(value) => updateField('threeQuarterInchToThreeInch', value)} />
            <QuantityFieldRow label="Union 1/2 inch" value={values.unionHalfInch} onChangeText={(value) => updateField('unionHalfInch', value)} />
            <QuantityFieldRow label="Plug 1/2 inch" value={values.plugHalfInch} onChangeText={(value) => updateField('plugHalfInch', value)} />
            <QuantityFieldRow label="1.5 inch fittings quantity" value={values.fittingsOneAndHalfInch} onChangeText={(value) => updateField('fittingsOneAndHalfInch', value)} />
            <QuantityFieldRow label="2 inch fittings quantity" value={values.fittingsTwoInch} onChangeText={(value) => updateField('fittingsTwoInch', value)} />
          </>
        ) : null}
      </Card>

      <Card style={styles.formCard}>
        <Input label="Remarks" value={values.remarks ?? ''} onChangeText={(value) => updateField('remarks', value)} />
        <EvidenceUploader title="Fittings Evidence" initialFiles={values.evidence} />
      </Card>
    </>
  );

  const footer = <SectionFormFooter onSaveDraft={save} onSubmit={submit} />;

  return { content, footer };
}

const styles = StyleSheet.create({
  groupTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  groupTab: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  groupText: {
    ...typography.label,
  },
  formCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
});
