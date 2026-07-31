import { router } from 'expo-router';
import { ArrowLeft, ClipboardList, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Screen } from '@/components/ui/Screen';
import { dprTaskTemplates } from '@/constants/dprTasks';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { planningApi, type PlanTaskPayload } from '@/services/planning.service';
import { projectsApi, type ProjectOption, type ProjectSiteOption } from '@/services/projects.service';

type PlanTask = {
  id: string;
  label: string;
  qty: string;
  worker: string;
};

type PlanSite = {
  id: string;
  projectId: string;
  siteId: string;
  tasks: PlanTask[];
};

function blankTasks(): PlanTask[] {
  return dprTaskTemplates.map((task) => ({ ...task, qty: '', worker: '' }));
}

function createSitePlan(index: number): PlanSite {
  return {
    id: `site-plan-${index}`,
    projectId: '',
    siteId: '',
    tasks: blankTasks(),
  };
}

export default function PlanScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState('2026-07-22');
  const [sitePlans, setSitePlans] = useState<PlanSite[]>([createSitePlan(1)]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    projectsApi
      .list()
      .then((rows) => setProjects(rows))
      .catch(() => setProjects([]));
  }, []);

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

  const updateSite = (siteId: string, patch: Partial<Pick<PlanSite, 'projectId' | 'siteId'>>) => {
    setSitePlans((current) =>
      current.map((site) => (site.id === siteId ? { ...site, ...patch } : site)),
    );
  };

  const setSiteTasks = useCallback((siteId: string, tasks: PlanTask[]) => {
    setSitePlans((current) =>
      current.map((site) => (site.id === siteId ? { ...site, tasks } : site)),
    );
  }, []);

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

  const handleSave = async () => {
    if (!user) return;
    const readySites = sitePlans.filter((site) => site.projectId && site.siteId);
    if (!readySites.length) {
      showToast('Select a project and site for at least one plan', 'error');
      return;
    }

    setSaving(true);
    try {
      for (const site of readySites) {
        const tasks: PlanTaskPayload[] = site.tasks.map((task) => ({
          id: task.id as PlanTaskPayload['id'],
          qty: task.qty || undefined,
          worker: task.worker || undefined,
        }));
        await planningApi.upsertSitePlan({ projectId: site.projectId, siteId: site.siteId, date, tasks });
      }
      showToast('Plan saved', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button label="Add Site" variant="outline" icon={<Plus size={17} color={colors.primary} />} onPress={addSitePlan} style={styles.footerButton} />
          <Button label="Save Plan" onPress={() => void handleSave()} loading={saving} style={styles.footerButton} />
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
            date={date}
            supervisorId={user?.id}
            projects={projects}
            onChangeSite={updateSite}
            onTasksLoaded={setSiteTasks}
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
  date,
  supervisorId,
  projects,
  onChangeSite,
  onTasksLoaded,
  onTaskChange,
}: {
  index: number;
  site: PlanSite;
  date: string;
  supervisorId?: string;
  projects: ProjectOption[];
  onChangeSite: (siteId: string, patch: Partial<Pick<PlanSite, 'projectId' | 'siteId'>>) => void;
  onTasksLoaded: (siteId: string, tasks: PlanTask[]) => void;
  onTaskChange: (
    siteId: string,
    taskId: string,
    key: keyof Pick<PlanTask, 'qty' | 'worker'>,
    value: string,
  ) => void;
}) {
  const { colors } = useTheme();
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [siteSelectOpen, setSiteSelectOpen] = useState(false);
  const [siteOptions, setSiteOptions] = useState<ProjectSiteOption[]>([]);

  const projectOptions = projects.map((project) => ({ label: project.name, value: project.id }));
  const siteSelectOptions = siteOptions.map((option) => ({ label: option.name, value: option.id }));

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!site.projectId) {
        if (mounted) setSiteOptions([]);
        return;
      }

      try {
        const rows = await projectsApi.listSites(site.projectId);
        if (mounted) setSiteOptions(rows);
      } catch {
        if (mounted) setSiteOptions([]);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [site.projectId]);

  useEffect(() => {
    if (!site.siteId || !date || !supervisorId) return;

    let mounted = true;
    planningApi
      .listSitePlans({ siteId: site.siteId, date, supervisorId })
      .then((rows) => {
        const existing = rows[0];
        if (existing && mounted) {
          onTasksLoaded(
            site.id,
            dprTaskTemplates.map((task) => {
              const match = existing.tasks.find((item) => item.id === task.id);
              return { ...task, qty: match?.qty ?? '', worker: match?.worker ?? '' };
            }),
          );
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [site.id, site.siteId, date, supervisorId, onTasksLoaded]);

  return (
    <Card style={styles.siteCard}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>Site Plan {index}</Text>
      <SimpleSelect
        label="Project"
        value={site.projectId}
        options={projectOptions}
        open={projectSelectOpen}
        onOpenChange={setProjectSelectOpen}
        onChange={(value) => onChangeSite(site.id, { projectId: value, siteId: '' })}
        searchable
      />
      <SimpleSelect
        label="Site"
        value={site.siteId}
        options={siteSelectOptions}
        open={siteSelectOpen}
        onOpenChange={setSiteSelectOpen}
        onChange={(value) => onChangeSite(site.id, { siteId: value })}
        searchable
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
    textAlignVertical: 'center',
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
