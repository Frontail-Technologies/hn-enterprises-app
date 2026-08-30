import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ClipboardList } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { dprTaskTemplates } from "@/constants/dprTasks";
import { radius, spacing } from "@/constants/spacing";
import { tableText } from "@/constants/table";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { blankTasks, normalizeTasks, type PlanTask, type TaskSnapshot } from "@/hooks/workPlanningDraft";
import { successHaptic } from "@/lib/haptics";
import { useSitePlansQuery, useUpsertSitePlanMutation } from "@/queries";
import type { PlanTaskPayload } from "@/services/planning.service";
import { formatDate } from "@/utils/format";
import { isEqualSnapshot } from "@/utils/isEqualSnapshot";

export default function PlanScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { customerId, customerName, trBpNumber, projectId, siteId, siteName, date } = useLocalSearchParams<{
    customerId: string;
    customerName?: string;
    trBpNumber?: string;
    projectId: string;
    siteId: string;
    siteName?: string;
    date: string;
  }>();

  const [tasks, setTasks] = useState<PlanTask[]>(blankTasks());
  const [initialSnapshot, setInitialSnapshot] = useState<TaskSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const sitePlansQuery = useSitePlansQuery(
    { customerId, date, supervisorId: user?.id },
    { enabled: Boolean(customerId && date && user?.id) },
  );
  const upsertSitePlanMutation = useUpsertSitePlanMutation();

  useEffect(() => {
    if (sitePlansQuery.isLoading) return;

    queueMicrotask(() => {
      const existing = sitePlansQuery.data?.[0];
      const hydratedTasks = !existing
        ? blankTasks()
        : dprTaskTemplates.map((task) => {
            const match = existing.tasks.find((item) => item.id === task.id);
            return { ...task, qty: match?.qty ?? "", worker: match?.worker ?? "" };
          });
      setTasks(hydratedTasks);
      setInitialSnapshot(normalizeTasks(hydratedTasks));
      setHydrated(true);
    });
  }, [sitePlansQuery.data, sitePlansQuery.isLoading]);

  const isLoading = !hydrated;

  const isDirty = useMemo(
    () => initialSnapshot !== null && !isEqualSnapshot(normalizeTasks(tasks), initialSnapshot),
    [tasks, initialSnapshot],
  );

  const totalQty = tasks.reduce((sum, task) => sum + (Number(task.qty) || 0), 0);

  const updateTask = (taskId: string, key: keyof Pick<PlanTask, "qty" | "worker">, value: string) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, [key]: value } : task)));
  };

  const handleSave = async () => {
    if (!isDirty) return;

    try {
      const payload: PlanTaskPayload[] = tasks.map((task) => ({
        id: task.id as PlanTaskPayload["id"],
        qty: task.qty || undefined,
        worker: task.worker || undefined,
      }));
      await upsertSitePlanMutation.mutateAsync({ customerId, projectId, siteId, date, tasks: payload });
      setInitialSnapshot(normalizeTasks(tasks));
      successHaptic();
      showToast("Plan saved", "success");
      router.back();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to save plan", "error");
    }
  };

  return (
    <Screen
      scroll
      edges={["bottom"]}
      contentStyle={styles.screen}
      bottomAccessory={
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button
            label="Save Plan"
            onPress={() => void handleSave()}
            loading={upsertSitePlanMutation.isPending}
            disabled={!isDirty}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <AppHeader title="Work Planning" subtitle={`${siteName || ""} · ${formatDate(date)}`} left={<BackButton />} />

      <Card style={styles.summaryCard}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.softOrange }]}>
          <ClipboardList size={20} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.text }]} numberOfLines={1}>
            {customerName || "Customer"}
          </Text>
          <Text style={[typography.caption, { color: colors.muted }]} numberOfLines={1}>
            {trBpNumber || "-"}
          </Text>
        </View>
        {isLoading ? null : <Text style={[styles.totalText, { color: colors.primary }]}>{totalQty}</Text>}
      </Card>

      {isLoading ? (
        <View style={styles.skeletonBlock}>
          <Skeleton height={220} borderRadius={radius.sm} />
        </View>
      ) : (
        <View style={[styles.workTable, { borderColor: colors.border }]}>
          <View style={[styles.workHeaderRow, { backgroundColor: colors.surfaceMuted, borderBottomColor: colors.border }]}>
            <Text style={[styles.workHeaderText, { color: colors.muted }]}>TASK</Text>
            <Text style={[styles.qtyHeaderText, { color: colors.muted }]}>QTY</Text>
            <Text style={[styles.workerHeaderText, { color: colors.muted }]}>PLUMBER/LABOUR</Text>
          </View>
          {tasks.map((task) => (
            <View key={task.id} style={[styles.workRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.workLabel, { color: colors.text }]} numberOfLines={1}>
                {task.label}
              </Text>
              <TextInput
                value={task.qty}
                onChangeText={(value) => updateTask(task.id, "qty", value)}
                keyboardType="numeric"
                placeholder="-"
                placeholderTextColor={colors.muted}
                style={[styles.qtyInput, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text }]}
              />
              <TextInput
                value={task.worker}
                onChangeText={(value) => updateTask(task.id, "worker", value)}
                placeholder="-"
                placeholderTextColor={colors.muted}
                style={[styles.workerInput, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, color: colors.text }]}
              />
            </View>
          ))}
        </View>
      )}
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
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
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
  skeletonBlock: {
    gap: spacing.md,
  },
  workTable: {
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  workHeaderRow: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
  },
  workHeaderText: {
    flex: 1,
    ...tableText.header,
  },
  qtyHeaderText: {
    width: 68,
    ...tableText.header,
    textAlign: "center",
  },
  workerHeaderText: {
    width: 126,
    ...tableText.header,
  },
  workRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
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
    textAlign: "center",
    textAlignVertical: "center",
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
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: "auto",
  },
});
