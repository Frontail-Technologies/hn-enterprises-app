import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckSquare2, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { MaterialQuantityRow } from '@/components/shared/MaterialQuantityRow';
import { MeterReadingInput } from '@/components/shared/MeterReadingInput';
import { PhotoRequirementGrid } from '@/components/shared/PhotoRequirementGrid';
import { RequiredLabel } from '@/components/shared/RequiredLabel';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { TaskFormHeader } from '@/components/shared/TaskFormHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { getCustomerById } from '@/services/mockData';

const delayReasons = ['Pipeline not charged', 'Customer unavailable', 'Material pending', 'No delay'] as const;

export default function InstallationTaskScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const customer = getCustomerById(params.id ?? '');
  const [installationDate, setInstallationDate] = useState(customer?.commissioningConversion.installationDate ?? '');
  const [delayReason, setDelayReason] = useState<(typeof delayReasons)[number]>('Pipeline not charged');
  const [meterNumber, setMeterNumber] = useState(customer?.commissioningConversion.meterNo ?? '');
  const [meterConnection, setMeterConnection] = useState('RHS');
  const [meterReading, setMeterReading] = useState(customer?.commissioningConversion.meterReading ?? '');
  const [installRegulator, setInstallRegulator] = useState(true);
  const [regulatorType, setRegulatorType] = useState(customer?.commissioningConversion.regulatorPressure ?? '');
  const [proposedConversionDate, setProposedConversionDate] = useState(customer?.commissioningConversion.conversionDate ?? '');
  const [rfcDate, setRfcDate] = useState('16-07-2026');
  const [remarks, setRemarks] = useState('');
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();

  const initialMaterials = useMemo(() => {
    if (!customer) return [];

    return [
      { id: 'gi-half', category: 'Pipe' as const, label: 'GI PIPE - 1/2 INCH', unit: 'Meter', value: customer.giMeasurements.totalGiPipeHalfInch },
      { id: 'gi-three-quarter', category: 'Pipe' as const, label: 'GI PIPE - 3/4 INCH', unit: 'Meter', value: customer.giMeasurements.giPipeThreeQuarterInch },
      { id: 'gi-one', category: 'Pipe' as const, label: 'GI PIPE - 1 INCH', unit: 'Meter', value: customer.giMeasurements.giPipeOneInch },
      { id: 'valve-half', category: 'Valve' as const, label: 'Isolation Valve 1/2 inch', unit: 'Nos', value: customer.isolationFittings.isolationValveHalfInch },
      { id: 'appliance-valve', category: 'Valve' as const, label: 'Appliance Valve 1/2 inch', unit: 'Nos', value: customer.isolationFittings.applianceValveHalfInch },
      { id: 'clamp-half', category: 'Fitting' as const, label: 'Clamp 1/2 inch', unit: 'Nos', value: customer.isolationFittings.clampHalfInch },
      { id: 'elbow-half', category: 'Fitting' as const, label: 'Elbow 1/2 inch', unit: 'Nos', value: customer.isolationFittings.elbowHalfInch },
    ];
  }, [customer]);
  const [materials, setMaterials] = useState(initialMaterials);

  if (!customer) {
    return (
      <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader title="Installation" left={<BackButton />} />
        <View style={styles.emptyState}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>Customer not found</Text>
          <Button label="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const submit = () => {
    showToast('LMC installation submitted', 'success');
    router.back();
  };
  const saveDraft = () => {
    showToast('Installation draft saved', 'success');
  };

  const updateMaterial = (id: string, value: string) => {
    setMaterials((current) => current.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={<SectionFormFooter onSaveDraft={saveDraft} onSubmit={submit} submitLabel="Submit" />}
    >
      <AppHeader title="LMC Installation" subtitle={customer.customerConnection.trBpNo} left={<BackButton />} />

      <TaskFormHeader
        customer={customer}
        taskTitle="LMC Installation"
        taskSubtitle="Capture meter, regulator, material and proof."
      />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Installation Details</Text>
        <View style={styles.fieldStack}>
          <DateField label="Date of Feasibility" value={customer.survey.surveyDate} editable={false} />
          <DateField
            label="Date of Installation"
            value={installationDate}
            onChangeText={setInstallationDate}
          />
          <View style={styles.fieldGroup}>
            <RequiredLabel label="Reason for Delay" required />
            <View style={styles.optionGrid}>
              {delayReasons.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => setDelayReason(reason)}
                  style={[
                    styles.optionChip,
                    {
                      backgroundColor: delayReason === reason ? colors.softOrange : colors.card,
                      borderColor: delayReason === reason ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: delayReason === reason ? colors.primary : colors.text }]}>
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.twoColumn}>
            <View style={styles.flexField}>
              <Input label="Meter Number" value={meterNumber} onChangeText={setMeterNumber} />
            </View>
            <View style={styles.smallField}>
              <Input label="Meter Connection" value={meterConnection} onChangeText={setMeterConnection} />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <RequiredLabel label="Meter Initial Reading" required />
            <MeterReadingInput value={meterReading} onChangeText={setMeterReading} />
          </View>
          <Pressable
            onPress={() => setInstallRegulator((current) => !current)}
            style={[styles.checkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {installRegulator ? (
              <CheckSquare2 size={23} color={colors.green} />
            ) : (
              <Square size={23} color={colors.muted} />
            )}
            <Text style={[styles.checkText, { color: colors.text }]}>Do you want to install regulator?</Text>
          </Pressable>
          <Input label="Regulator Type" value={regulatorType} onChangeText={setRegulatorType} />
          <DateField
            label="Proposed NG Conversion Date"
            value={proposedConversionDate}
            onChangeText={setProposedConversionDate}
          />
          <DateField
            label="RFC Date"
            value={rfcDate}
            onChangeText={setRfcDate}
          />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Material / Pipe Used</Text>
        <View style={styles.materialList}>
          {materials.map((item) => (
            <MaterialQuantityRow
              key={item.id}
              category={item.category}
              label={item.label}
              unit={item.unit}
              value={item.value}
              onChangeText={(value) => updateMaterial(item.id, value)}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.formCard}>
        <PhotoRequirementGrid
          requirements={[
            { id: 'meter-photo', label: 'Meter Photo', required: true },
            { id: 'rfc-photo', label: 'RFC Photo' },
            { id: 'pneumatic-report', label: 'Pneumatic Test Report' },
            { id: 'house-photo', label: 'House Photo', required: true },
          ]}
        />
      </Card>

      <Card style={styles.formCard}>
        <RequiredLabel label="Remarks" />
        <TextInput
          ref={remarksRef}
          onFocus={remarksOnFocus}
          value={remarks}
          onChangeText={setRemarks}
          multiline
          placeholder="Add installation remarks..."
          placeholderTextColor={colors.muted}
          style={[
            styles.remarksInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          textAlignVertical="top"
        />
      </Card>
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerAction}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 128,
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
  formCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  fieldStack: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    minHeight: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  optionText: {
    ...typography.label,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexField: {
    flex: 1,
  },
  smallField: {
    width: 132,
  },
  checkCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  checkText: {
    ...typography.bodyMedium,
    flex: 1,
  },
  materialList: {
    gap: spacing.sm,
  },
  remarksInput: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
