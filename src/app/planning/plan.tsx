import { router } from 'expo-router';
import { ArrowLeft, ClipboardList, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

type PlanSite = {
  id: string;
  siteAddress: SiteAddress;
  tasks: PlanTask[];
};

type SiteAddress = 'radha-nagar' | 'shyam-a' | 'shyam-b' | 'metro-stretch';

type PlanTask = {
  id: string;
  label: string;
  qty: string;
  worker: string;
};

const taskTemplates: Omit<PlanTask, 'qty' | 'worker'>[] = [
  { id: 'survey', label: 'SURVEY DONE' },
  { id: 'gi', label: 'GI DONE' },
  { id: 'gc', label: 'GC DONE' },
  { id: 'laying', label: 'LAYING' },
  { id: 'valve', label: 'VALVE CHAMBER' },
  { id: 'pre', label: 'PREE COMMISING' },
  { id: 'conversion', label: 'CONVERSION DONE' },
  { id: 'jmr', label: 'JMR DONE' },
  { id: 'expense', label: 'SITE EXPENSES DONE' },
  { id: 'testing', label: 'FLUSSHING/TESTING' },
  { id: 'route', label: 'ROUTE MARKER/POLE MARKER' },
  { id: 'commissioning', label: 'COMMISSING' },
];

const siteAddressOptions: { label: string; value: SiteAddress }[] = [
  { label: 'Radha Nagar', value: 'radha-nagar' },
  { label: 'Shyam Nagar Block A', value: 'shyam-a' },
  { label: 'Shyam Nagar Block B', value: 'shyam-b' },
  { label: 'Metro Corridor, Shyam Nagar', value: 'metro-stretch' },
];

function createSitePlan(index: number): PlanSite {
  return {
    id: `site-plan-${index}`,
    siteAddress: index === 1 ? 'radha-nagar' : 'shyam-a',
    tasks: taskTemplates.map((task) => ({
      ...task,
      qty: index === 1 ? '1' : '',
      worker: index === 1 && task.id === 'survey'
        ? 'Jabed'
        : index === 1 && task.id === 'route'
          ? 'Mukesh'
          : '',
    })),
  };
}

export default function PlanScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [date, setDate] = useState('2026-07-22');
  const [sitePlans, setSitePlans] = useState<PlanSite[]>([createSitePlan(1)]);

  const totalQty = useMemo(
    () =>
      sitePlans.reduce(
        (sum, site) =>
          sum +
          site.tasks.reduce((inner, task) => inner + (Number(task.qty) || 0), 0),
        0,
      ),
    [sitePlans],
  );

  const updateSite = (siteId: string, value: SiteAddress) => {
    setSitePlans((current) =>
      current.map((site) => (site.id === siteId ? { ...site, siteAddress: value } : site)),
    );
  };

  const updateTask = (siteId: string, taskId: string, key: keyof Pick<PlanTask, 'qty' | 'worker'>, value: string) => {
    setSitePlans((current) =>
      current.map((site) =>
        site.id === siteId
          ? {
              ...site,
              tasks: site.tasks.map((task) =>
                task.id === taskId ? { ...task, [key]: value } : task,
              ),
            }
          : site,
      ),
    );
  };

  const addSitePlan = () => {
    setSitePlans((current) => [...current, createSitePlan(current.length + 1)]);
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button label="Add Site" variant="outline" icon={<Plus size={17} color={colors.primary} />} onPress={addSitePlan} style={styles.footerButton} />
          <Button label="Save Plan" onPress={() => showToast('Plan saved', 'success')} style={styles.footerButton} />
        </View>
      }
    >
      <AppHeader title="Planning" subtitle="Create site-wise daily plan" left={<BackButton />} />

      <Card style={styles.summaryCard}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.softOrange }]}>
          <ClipboardList size={20} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Total Planned Qty</Text>
          <Text style={[typography.caption, { color: colors.muted }]}>
            {sitePlans.length} site plan{sitePlans.length > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={[styles.totalText, { color: colors.primary }]}>{totalQty}</Text>
      </Card>

      <DateField label="Plan Date" value={date} onChangeText={setDate} />

      <View style={styles.siteList}>
        {sitePlans.map((site, index) => (
          <SitePlanCard
            key={site.id}
            index={index + 1}
            site={site}
            onChange={updateSite}
            onTaskChange={updateTask}
          />
        ))}
      </View>
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

function SitePlanCard({
  index,
  site,
  onChange,
  onTaskChange,
}: {
  index: number;
  site: PlanSite;
  onChange: (siteId: string, value: SiteAddress) => void;
  onTaskChange: (
    siteId: string,
    taskId: string,
    key: keyof Pick<PlanTask, 'qty' | 'worker'>,
    value: string,
  ) => void;
}) {
  const { colors } = useTheme();
  const [siteSelectOpen, setSiteSelectOpen] = useState(false);

  return (
    <Card style={styles.siteCard}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Site Plan {index}</Text>
      <SimpleSelect
        label="Site Address"
        value={site.siteAddress}
        options={siteAddressOptions}
        open={siteSelectOpen}
        onOpenChange={setSiteSelectOpen}
        onChange={(value) => onChange(site.id, value)}
      />

      <View style={[styles.workTable, { borderColor: colors.border }]}>
        <View style={[styles.workHeaderRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.workHeaderText, { color: colors.muted }]}>TASK</Text>
          <Text style={[styles.qtyHeaderText, { color: colors.muted }]}>QTY</Text>
          <Text style={[styles.workerHeaderText, { color: colors.muted }]}>PLUMBER/LABOUR</Text>
        </View>
        {site.tasks.map((task) => (
          <View key={task.id} style={[styles.workRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.workLabel, { color: colors.text }]} numberOfLines={1}>
              {task.label}
            </Text>
            <TextInput
              value={task.qty}
              onChangeText={(value) => onTaskChange(site.id, task.id, 'qty', value)}
              keyboardType="numeric"
              placeholder="-"
              placeholderTextColor={colors.muted}
              style={[
                styles.qtyInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
            />
            <TextInput
              value={task.worker}
              onChangeText={(value) => onTaskChange(site.id, task.id, 'worker', value)}
              placeholder="-"
              placeholderTextColor={colors.muted}
              style={[
                styles.workerInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
              ]}
            />
          </View>
        ))}
      </View>
    </Card>
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
  siteList: {
    gap: spacing.md,
  },
  siteCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  cardTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  workTable: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  workHeaderRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
  },
  workHeaderText: {
    flex: 1,
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  qtyHeaderText: {
    width: 68,
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  workerHeaderText: {
    width: 126,
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  workRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  workLabel: {
    flex: 1,
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  qtyInput: {
    width: 68,
    minHeight: 32,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    ...typography.body,
  },
  workerInput: {
    width: 126,
    minHeight: 32,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    ...typography.caption,
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
