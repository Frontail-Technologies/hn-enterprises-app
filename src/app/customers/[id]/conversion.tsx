import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckSquare2, Square } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
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
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { getCustomerById } from '@/services/mockData';

export default function ConversionTaskScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ id?: string }>();
  const customer = getCustomerById(params.id ?? '');
  const [conversionDate, setConversionDate] = useState(customer?.commissioningConversion.conversionDate ?? '');
  const [burnersNo, setBurnersNo] = useState('2');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [email, setEmail] = useState('');
  const [replaceMeter, setReplaceMeter] = useState(false);
  const [replaceRegulator, setReplaceRegulator] = useState(false);
  const [meterNumber, setMeterNumber] = useState(customer?.commissioningConversion.meterNo ?? '');
  const [meterConnection, setMeterConnection] = useState('RHS');
  const [meterReading, setMeterReading] = useState(customer?.commissioningConversion.meterReading ?? '');
  const [regulatorType, setRegulatorType] = useState(customer?.commissioningConversion.regulatorPressure ?? '');
  const [regulatorNo, setRegulatorNo] = useState(customer?.commissioningConversion.regulatorNo ?? '');
  const [remarks, setRemarks] = useState(customer?.commissioningConversion.nonConversionRemark ?? '');
  const { ref: remarksRef, onFocus: remarksOnFocus } = useScrollIntoViewOnFocus();

  if (!customer) {
    return (
      <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
        <AppHeader title="NG Conversion" left={<BackButton />} />
        <View style={styles.emptyState}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>Customer not found</Text>
          <Button label="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const submit = () => {
    showToast('NG conversion submitted', 'success');
    router.back();
  };
  const saveDraft = () => {
    showToast('Conversion draft saved', 'success');
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={<SectionFormFooter onSaveDraft={saveDraft} onSubmit={submit} submitLabel="Submit" />}
    >
      <AppHeader title="NG Conversion" subtitle={customer.customerConnection.trBpNo} left={<BackButton />} />

      <TaskFormHeader
        customer={customer}
        taskTitle="NG Conversion"
        taskSubtitle="Capture conversion details, meter reading and evidence."
      />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Conversion Details</Text>
        <View style={styles.fieldStack}>
          <DateField label="Date of Installation" value={customer.commissioningConversion.installationDate} editable={false} />
          <DateField
            label="Proposed NG Conversion Date"
            value={customer.commissioningConversion.conversionDate}
            editable={false}
          />
          <DateField
            label="NG Conversion Date"
            value={conversionDate}
            onChangeText={setConversionDate}
          />
          <View style={styles.twoColumn}>
            <View style={styles.flexField}>
              <Input label="Burners No" value={burnersNo} onChangeText={setBurnersNo} keyboardType="number-pad" />
            </View>
            <View style={styles.flexField}>
              <Input
                label="Family Members"
                value={familyMembers}
                onChangeText={setFamilyMembers}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Input
            label="Registered Mobile Number"
            value={customer.customerConnection.mobileNo}
            editable={false}
          />
          <Input
            label="Alternate Mobile Number"
            value={alternateMobile}
            onChangeText={setAlternateMobile}
            keyboardType="phone-pad"
          />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Meter & Regulator</Text>
        <View style={styles.fieldStack}>
          <ToggleCard
            label="Do you want to replace meter?"
            selected={replaceMeter}
            onPress={() => setReplaceMeter((current) => !current)}
          />
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
          <ToggleCard
            label="Do you want to replace regulator?"
            selected={replaceRegulator}
            onPress={() => setReplaceRegulator((current) => !current)}
          />
          <Input label="Regulator Type" value={regulatorType} onChangeText={setRegulatorType} />
          <Input label="Regulator No." value={regulatorNo} onChangeText={setRegulatorNo} />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <PhotoRequirementGrid
          requirements={[
            { id: 'meter-photo', label: 'Meter Photo', required: true },
            { id: 'ngc-report', label: 'NGC Report File' },
            { id: 'rfc-photo', label: 'RFC Photo' },
            { id: 'pneumatic-report', label: 'Pneumatic Test Report' },
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
          placeholder="Add conversion remarks..."
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

function ToggleCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.checkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {selected ? <CheckSquare2 size={23} color={colors.green} /> : <Square size={23} color={colors.muted} />}
      <Text style={[styles.checkText, { color: colors.text }]}>{label}</Text>
    </Pressable>
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
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  checkText: {
    ...typography.bodyMedium,
    flex: 1,
  },
  remarksInput: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
  },
});
