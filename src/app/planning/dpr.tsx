import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/shared/AppHeader';
import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { dprTaskTemplates } from '@/constants/dprTasks';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import type { EvidenceFile } from '@/services/mockData';
import { planningApi, type DprTaskPayload, type PlanningEvidenceFile } from '@/services/planning.service';
import { projectsApi, type ProjectOption, type ProjectSiteOption } from '@/services/projects.service';

type DprItem = {
  id: string;
  label: string;
  plannedQty: string;
  completedQty: string;
  worker: string;
  delayReason: string;
};

const initialItems: DprItem[] = dprTaskTemplates.map((task) => ({
  id: task.id,
  label: task.label,
  plannedQty: '',
  completedQty: '',
  worker: '',
  delayReason: '',
}));

function toPlanningEvidence(files: EvidenceFile[]): PlanningEvidenceFile[] {
  return files
    .filter((file) => Boolean(file.fileUrl))
    .map((file) => ({
      id: file.id,
      fileName: file.fileName,
      fileUrl: file.fileUrl as string,
      mimeType: file.mimeType,
      capturedAt: file.capturedAt,
    }));
}

function fromPlanningEvidence(files: PlanningEvidenceFile[]): EvidenceFile[] {
  return files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileUrl: file.fileUrl,
    uri: file.fileUrl,
    mimeType: file.mimeType,
    capturedAt: file.capturedAt,
    status: 'Uploaded',
  }));
}

export default function DprScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState('2026-07-22');
  const [projectId, setProjectId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [siteOptions, setSiteOptions] = useState<ProjectSiteOption[]>([]);
  const [projectSelectOpen, setProjectSelectOpen] = useState(false);
  const [siteSelectOpen, setSiteSelectOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState<EvidenceFile[]>([]);
  const [evidenceLoadToken, setEvidenceLoadToken] = useState(0);
  const [items, setItems] = useState(initialItems);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    projectsApi
      .list()
      .then((rows) => setProjects(rows))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!projectId) {
        if (mounted) {
          setSiteOptions([]);
          setSiteId('');
        }
        return;
      }

      try {
        const rows = await projectsApi.listSites(projectId);
        if (mounted) setSiteOptions(rows);
      } catch {
        if (mounted) setSiteOptions([]);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!siteId || !date || !user?.id) return;

    let mounted = true;
    planningApi
      .listDprRecords({ siteId, date, supervisorId: user.id })
      .then((rows) => {
        if (!mounted) return;
        const existing = rows[0];

        if (existing) {
          setItems(
            dprTaskTemplates.map((task) => {
              const match = existing.tasks.find((item) => item.id === task.id);
              return {
                ...task,
                plannedQty: match?.plannedQty ?? '',
                completedQty: match?.completedQty ?? '',
                worker: match?.worker ?? '',
                delayReason: match?.delayReason ?? '',
              };
            }),
          );
          setRemarks(existing.remarks ?? '');
          setEvidence(fromPlanningEvidence(existing.evidence ?? []));
        } else {
          setItems(initialItems);
          setRemarks('');
          setEvidence([]);
        }
        setEvidenceLoadToken((token) => token + 1);
      })
      .catch(() => {
        if (mounted) setEvidenceLoadToken((token) => token + 1);
      });

    return () => {
      mounted = false;
    };
  }, [siteId, date, user?.id]);

  const totalCompleted = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.completedQty) || 0), 0),
    [items],
  );

  const updateItem = (id: string, field: keyof DprItem, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const projectOptions = projects.map((project) => ({ label: project.name, value: project.id }));
  const siteSelectOptions = siteOptions.map((option) => ({ label: option.name, value: option.id }));
  const siteLabel = siteOptions.find((option) => option.id === siteId)?.name ?? 'Select a site';

  const handleSubmit = async () => {
    if (!projectId || !siteId) {
      showToast('Select a project and site first', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const tasks: DprTaskPayload[] = items.map((item) => ({
        id: item.id as DprTaskPayload['id'],
        plannedQty: item.plannedQty || undefined,
        completedQty: item.completedQty || undefined,
        worker: item.worker || undefined,
        delayReason: item.delayReason || undefined,
      }));

      await planningApi.upsertDprRecord({
        projectId,
        siteId,
        date,
        status: 'submitted',
        remarks: remarks || undefined,
        tasks,
        evidence: toPlanningEvidence(evidence),
      });
      showToast('DPR submitted', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to submit DPR', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      contentStyle={styles.screen}
      bottomAccessory={
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            label="Submit DPR"
            icon={<CheckCircle2 size={17} color="#FFFFFF" />}
            onPress={() => void handleSubmit()}
            loading={submitting}
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
          <Text style={[typography.caption, { color: colors.muted }]}>{siteLabel}</Text>
        </View>
        <Text style={[styles.totalText, { color: colors.primary }]}>{totalCompleted}</Text>
      </Card>

      <Card style={styles.contextCard}>
        <DateField label="DPR Date" value={date} onChangeText={setDate} />
        <SimpleSelect
          label="Project"
          value={projectId}
          options={projectOptions}
          open={projectSelectOpen}
          onOpenChange={setProjectSelectOpen}
          onChange={setProjectId}
          searchable
        />
        <SimpleSelect
          label="Site"
          value={siteId}
          options={siteSelectOptions}
          open={siteSelectOpen}
          onOpenChange={setSiteSelectOpen}
          onChange={setSiteId}
          searchable
        />
      </Card>

      <EvidenceUploader
        key={`dpr-evidence-${evidenceLoadToken}`}
        title="DPR Photos"
        initialFiles={evidence}
        module="dpr"
        onChange={setEvidence}
      />

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
                <TextInput
                  value={item.plannedQty}
                  onChangeText={(value) => updateItem(item.id, 'plannedQty', value)}
                  keyboardType="numeric"
                  placeholder="-"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.cellInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                  ]}
                />
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
