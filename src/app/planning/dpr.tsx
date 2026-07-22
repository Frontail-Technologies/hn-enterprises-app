import { router } from 'expo-router';
import { ArrowLeft, Camera, CheckCircle2, FileText } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/shared/AppHeader';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

type DprItem = {
  id: string;
  label: string;
  plannedQty: string;
  completedQty: string;
  worker: string;
  delayReason: string;
};

type SiteAddress = 'radha-nagar' | 'shyam-a' | 'shyam-b' | 'metro-stretch';

const siteAddressOptions: { label: string; value: SiteAddress }[] = [
  { label: 'Radha Nagar', value: 'radha-nagar' },
  { label: 'Shyam Nagar Block A', value: 'shyam-a' },
  { label: 'Shyam Nagar Block B', value: 'shyam-b' },
  { label: 'Metro Corridor, Shyam Nagar', value: 'metro-stretch' },
];

const siteAddressLabels = Object.fromEntries(
  siteAddressOptions.map((option) => [option.value, option.label]),
) as Record<SiteAddress, string>;

const initialItems: DprItem[] = [
  { id: 'survey', label: 'SURVEY DONE', plannedQty: '1', completedQty: '1', worker: 'Jabed', delayReason: '' },
  { id: 'gi', label: 'GI DONE', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'gc', label: 'GC DONE', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'laying', label: 'LAYING', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'valve', label: 'VALVE CHAMBER', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'pre', label: 'PREE COMMISING', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'conversion', label: 'CONVERSION DONE', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'jmr', label: 'JMR DONE', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'expense', label: 'SITE EXPENSES DONE', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'testing', label: 'FLUSSHING/TESTING', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
  { id: 'route', label: 'ROUTE MARKER/POLE MARKER', plannedQty: '1', completedQty: '', worker: 'Mukesh', delayReason: '' },
  { id: 'commissioning', label: 'COMMISSING', plannedQty: '1', completedQty: '', worker: '', delayReason: '' },
];

export default function DprScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [date, setDate] = useState('2026-07-22');
  const [siteAddress, setSiteAddress] = useState<SiteAddress>('radha-nagar');
  const [siteSelectOpen, setSiteSelectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [photoCount, setPhotoCount] = useState(0);
  const [items, setItems] = useState(initialItems);

  const totalCompleted = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.completedQty) || 0), 0),
    [items],
  );

  const updateItem = (id: string, field: keyof DprItem, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            label={photoCount ? `${photoCount} Photos` : 'Add Photos'}
            variant="outline"
            icon={<Camera size={17} color={colors.primary} />}
            onPress={() => {
              setPhotoCount((count) => count + 1);
              showToast('Photo added', 'success');
            }}
            style={styles.footerButton}
          />
          <Button
            label="Submit DPR"
            icon={<CheckCircle2 size={17} color="#FFFFFF" />}
            onPress={() => showToast('DPR submitted', 'success')}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <AppHeader title="DPR" subtitle="Submit completed work" left={<BackButton />} />

      <Card style={styles.summaryCard}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.softOrange }]}>
          <FileText size={20} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Completed Qty</Text>
          <Text style={[typography.caption, { color: colors.muted }]}>
            {siteAddressLabels[siteAddress]}
          </Text>
        </View>
        <Text style={[styles.totalText, { color: colors.primary }]}>{totalCompleted}</Text>
      </Card>

      <Card style={styles.contextCard}>
        <DateField label="DPR Date" value={date} onChangeText={setDate} />
        <SimpleSelect
          label="Site Address"
          value={siteAddress}
          options={siteAddressOptions}
          open={siteSelectOpen}
          onOpenChange={setSiteSelectOpen}
          onChange={setSiteAddress}
        />
        <View style={[styles.photoStatus, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Camera size={16} color={colors.primary} />
          <Text style={[styles.photoStatusText, { color: colors.text }]}>
            Photos added: {photoCount}
          </Text>
        </View>
      </Card>

      <View style={styles.itemList}>
        {items.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <View style={styles.itemTop}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.label}</Text>
              <Text style={[typography.caption, { color: colors.muted }]}>Planned: {item.plannedQty}</Text>
            </View>
            <View style={styles.itemInputs}>
              <View style={styles.qtyField}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Completed</Text>
                <TextInput
                  value={item.completedQty}
                  onChangeText={(value) => updateItem(item.id, 'completedQty', value)}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.qtyInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>
              <View style={styles.workerField}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Plumber/Labour</Text>
                <TextInput
                  value={item.worker}
                  onChangeText={(value) => updateItem(item.id, 'worker', value)}
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.workerInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>
              <View style={styles.delayField}>
                <Text style={[styles.inputLabel, { color: colors.muted }]}>Delay Reason</Text>
                <TextInput
                  value={item.delayReason}
                  onChangeText={(value) => updateItem(item.id, 'delayReason', value)}
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.delayInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>
            </View>
          </Card>
        ))}
      </View>

      <Input
        label="Supervisor Remarks"
        value={remarks}
        onChangeText={setRemarks}
        placeholder="Add DPR remarks"
      />
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerButton}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 116,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  totalText: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 27,
    lineHeight: 32,
  },
  contextCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  photoStatus: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  photoStatusText: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
  itemList: {
    gap: spacing.sm,
  },
  itemCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemTitle: {
    flex: 1,
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  itemInputs: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  qtyField: {
    gap: spacing.xs,
  },
  workerField: {
    gap: spacing.xs,
  },
  delayField: {
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  qtyInput: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    ...typography.body,
  },
  workerInput: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  delayInput: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
