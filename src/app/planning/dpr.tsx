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
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { dprTaskTemplates, type DprTaskId } from '@/constants/dprTasks';
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

const seededItemValues: Partial<Record<DprTaskId, Partial<Omit<DprItem, 'id' | 'label'>>>> = {
  survey: { completedQty: '1', worker: 'Jabed' },
  route: { worker: 'Mukesh' },
};

const initialItems: DprItem[] = dprTaskTemplates.map((task) => ({
  id: task.id,
  label: task.label,
  plannedQty: '1',
  completedQty: '',
  worker: '',
  delayReason: '',
  ...seededItemValues[task.id],
}));

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
          searchable
        />
        <View style={[styles.photoStatus, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Camera size={16} color={colors.primary} />
          <Text style={[styles.photoStatusText, { color: colors.text }]}>
            Photos added: {photoCount}
          </Text>
        </View>
      </Card>

      <View style={styles.tablePanel}>
        <ScrollableTable
          header={
            <View style={[styles.tableRow, styles.tableHeaderRow, { backgroundColor: colors.softOrange, borderColor: colors.border }]}>
              <Text style={[styles.headerCell, styles.taskCell, { color: colors.muted, borderColor: colors.border }]}>Task</Text>
              <Text style={[styles.headerCell, styles.plannedCell, { color: colors.muted, borderColor: colors.border }]}>Planned</Text>
              <Text style={[styles.headerCell, styles.completedCell, { color: colors.muted, borderColor: colors.border }]}>Completed</Text>
              <Text style={[styles.headerCell, styles.workerCell, { color: colors.muted, borderColor: colors.border }]}>Worker</Text>
              <Text style={[styles.headerCell, styles.delayCell, { color: colors.muted, borderColor: colors.border }]}>Delay Reason</Text>
            </View>
          }
        >
          {items.map((item) => (
            <View key={item.id} style={[styles.tableRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.bodyCell, styles.taskCell, { borderColor: colors.border }]}>
                <Text style={[styles.taskText, { color: colors.text }]} numberOfLines={2}>
                  {item.label}
                </Text>
              </View>
              <View style={[styles.bodyCell, styles.plannedCell, { borderColor: colors.border }]}>
                <Text style={[styles.bodyText, { color: colors.text }]}>{item.plannedQty || '-'}</Text>
              </View>
              <View style={[styles.bodyCell, styles.completedCell, { borderColor: colors.border }]}>
                <TextInput
                  value={item.completedQty}
                  onChangeText={(value) => updateItem(item.id, 'completedQty', value)}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.cellInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>
              <View style={[styles.bodyCell, styles.workerCell, { borderColor: colors.border }]}>
                <TextInput
                  value={item.worker}
                  onChangeText={(value) => updateItem(item.id, 'worker', value)}
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.cellInputWide,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>
              <View style={[styles.bodyCell, styles.delayCell, { borderColor: colors.border }]}>
                <TextInput
                  value={item.delayReason}
                  onChangeText={(value) => updateItem(item.id, 'delayReason', value)}
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.cellInputWide,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>
            </View>
          ))}
        </ScrollableTable>
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
  tablePanel: {
    gap: spacing.sm,
  },
  tableRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tableHeaderRow: {
    minHeight: 36,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  headerCell: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    minHeight: 36,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  bodyCell: {
    justifyContent: 'center',
    borderRightWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  taskText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  bodyText: {
    ...typography.body,
    fontSize: 12,
    textAlign: 'center',
  },
  taskCell: {
    width: 160,
  },
  plannedCell: {
    width: 68,
  },
  completedCell: {
    width: 90,
  },
  workerCell: {
    width: 122,
  },
  delayCell: {
    width: 150,
  },
  cellInput: {
    width: '100%',
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    textAlignVertical: 'center',
    ...typography.body,
    fontSize: 12,
  },
  cellInputWide: {
    width: '100%',
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    ...typography.body,
    fontSize: 11,
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
