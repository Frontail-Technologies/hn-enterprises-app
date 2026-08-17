import { router } from "expo-router";
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateField } from "@/components/ui/DateField";
import { InlineFieldError } from "@/components/ui/InlineFieldError";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/shared/AppHeader";
import { EvidenceUploader } from "@/components/shared/EvidenceUploader";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { radius, spacing } from "@/constants/spacing";
import { tableDividers, tableMetrics, tableText } from "@/constants/table";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useDprForm } from "@/hooks/useDprForm";

const DPR_COL_WIDTH = {
  task: 158,
  planned: 80,
  completed: 104,
  worker: 118,
  delay: 150,
};
const DPR_TABLE_WIDTH = Object.values(DPR_COL_WIDTH).reduce(
  (total, width) => total + width,
  0,
);

export default function DprScreen() {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const {
    date,
    setDate,
    customerId,
    setCustomerId,
    customerSelectOpen,
    setCustomerSelectOpen,
    customerSelectOptions,
    customersLoading,
    customersError,
    refetchCustomers,
    derivedContext,
    errors,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    evidenceLoadToken,
    items,
    updateItem,
    totalCompleted,
    siteLabel,
    submitting,
    handleSubmit,
  } = useDprForm();

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.text,
  };

  return (
    <Screen
      scroll
      edges={["bottom"]}
      contentStyle={styles.screen}
      bottomAccessory={
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Button
            label={submitting ? "Submitting…" : "Submit DPR"}
            icon={<CheckCircle2 size={17} color="#FFFFFF" />}
            onPress={() => void handleSubmit()}
            loading={submitting}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <AppHeader title="DPR" left={<BackButton />} />

      <Card style={styles.summaryCard}>
        <View
          style={[styles.summaryIcon, { backgroundColor: colors.softOrange }]}
        >
          <FileText size={20} color={colors.primary} />
        </View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Completed Qty
          </Text>
          <Text style={[typography.caption, { color: colors.muted }]}>
            {siteLabel}
          </Text>
        </View>
        <Text style={[styles.totalText, { color: colors.primary }]}>
          {totalCompleted}
        </Text>
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        Basic Details
      </Text>
      <Card style={styles.contextCard}>
        <DateField label="DPR Date" value={date} onChangeText={setDate} />
        <View>
          <SimpleSelect
            label="Customer"
            value={customerId}
            options={customerSelectOptions}
            open={customerSelectOpen}
            onOpenChange={setCustomerSelectOpen}
            onChange={setCustomerId}
            searchable
            loading={customersLoading}
            error={Boolean(errors.customerId) || customersError}
            onRetry={refetchCustomers}
            emptyLabel="No customers available"
          />
          <InlineFieldError
            message={errors.customerId ? "Select a customer" : undefined}
          />
        </View>
        {derivedContext ? (
          <View style={styles.derivedRow}>
            <Text style={[styles.derivedLabel, { color: colors.muted }]}>
              Project · Site
            </Text>
            <Text
              style={[styles.derivedValue, { color: colors.text }]}
              numberOfLines={2}
            >
              {derivedContext}
            </Text>
          </View>
        ) : null}
      </Card>

      <Text style={[styles.sectionLabel, { color: colors.muted }]}>
        Work Details
      </Text>
      <View style={styles.tableCard}>
        <ScrollableTable
          minWidth={DPR_TABLE_WIDTH}
          header={
            <View
              style={[
                styles.tableHeader,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderBottomColor: dividers.header,
                },
              ]}
            >
              <HeaderCell
                label="Task"
                width={DPR_COL_WIDTH.task}
                divider={dividers.vertical}
                color={colors.muted}
              />
              <HeaderCell
                label="Planned"
                width={DPR_COL_WIDTH.planned}
                divider={dividers.vertical}
                color={colors.muted}
              />
              <HeaderCell
                label="Completed"
                width={DPR_COL_WIDTH.completed}
                divider={dividers.vertical}
                color={colors.muted}
              />
              <HeaderCell
                label="Worker"
                width={DPR_COL_WIDTH.worker}
                divider={dividers.vertical}
                color={colors.muted}
              />
              <HeaderCell
                label="Delay Reason"
                width={DPR_COL_WIDTH.delay}
                color={colors.muted}
              />
            </View>
          }
        >
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.tableRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            >
              <View
                style={[
                  styles.cell,
                  styles.cellDivider,
                  {
                    width: DPR_COL_WIDTH.task,
                    borderRightColor: dividers.vertical,
                  },
                ]}
              >
                <Text
                  style={[styles.taskText, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </View>
              <View
                style={[
                  styles.cell,
                  styles.cellDivider,
                  {
                    width: DPR_COL_WIDTH.planned,
                    borderRightColor: dividers.vertical,
                  },
                ]}
              >
                <TextInput
                  value={item.plannedQty}
                  onChangeText={(value) =>
                    updateItem(item.id, "plannedQty", value)
                  }
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.cellInput,
                    styles.cellInputCentered,
                    inputStyle,
                  ]}
                />
              </View>
              <View
                style={[
                  styles.cell,
                  styles.cellDivider,
                  {
                    width: DPR_COL_WIDTH.completed,
                    borderRightColor: dividers.vertical,
                  },
                ]}
              >
                <TextInput
                  value={item.completedQty}
                  onChangeText={(value) =>
                    updateItem(item.id, "completedQty", value)
                  }
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.cellInput,
                    styles.cellInputCentered,
                    inputStyle,
                  ]}
                />
              </View>
              <View
                style={[
                  styles.cell,
                  styles.cellDivider,
                  {
                    width: DPR_COL_WIDTH.worker,
                    borderRightColor: dividers.vertical,
                  },
                ]}
              >
                <TextInput
                  value={item.worker}
                  onChangeText={(value) => updateItem(item.id, "worker", value)}
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                  style={[styles.cellInput, inputStyle]}
                />
              </View>
              <View style={[styles.cell, { width: DPR_COL_WIDTH.delay }]}>
                <TextInput
                  value={item.delayReason}
                  onChangeText={(value) =>
                    updateItem(item.id, "delayReason", value)
                  }
                  placeholder="—"
                  placeholderTextColor={colors.muted}
                  style={[styles.cellInput, inputStyle]}
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
        placeholder="Add DPR remarks or issues"
        multiline
      />

      <EvidenceUploader
        key={`dpr-evidence-${evidenceLoadToken}`}
        title="DPR Photos"
        initialFiles={evidence}
        module="dpr"
        onChange={setEvidence}
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

function HeaderCell({
  label,
  width,
  divider,
  color,
}: {
  label: string;
  width: number;
  divider?: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.cell,
        divider ? styles.cellDivider : null,
        { width, borderRightColor: divider },
      ]}
    >
      <Text style={[styles.headerText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    paddingBottom: 116,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  totalText: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 26,
    lineHeight: 31,
  },
  sectionLabel: {
    ...tableText.header,
    marginBottom: -spacing.xs,
  },
  contextCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
  },
  derivedRow: {
    gap: 2,
  },
  derivedLabel: {
    ...tableText.header,
  },
  derivedValue: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  tableCard: {},
  tableHeader: {
    flexDirection: "row",
    height: tableMetrics.headerHeight,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    justifyContent: "center",
    paddingHorizontal: tableMetrics.cellPaddingH,
    paddingVertical: spacing.xs,
  },
  cellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    ...tableText.header,
  },
  taskText: {
    ...tableText.medium,
  },
  cellInput: {
    width: "100%",
    minHeight: 36,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    ...tableText.secondary,
  },
  cellInputCentered: {
    textAlign: "center",
    textAlignVertical: "center",
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
