import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react-native';
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
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useDprForm } from '@/hooks/useDprForm';

export default function DprScreen() {
  const { colors } = useTheme();
  const {
    date,
    setDate,
    projectId,
    handleProjectChange,
    siteId,
    setSiteId,
    projectSelectOpen,
    setProjectSelectOpen,
    siteSelectOpen,
    setSiteSelectOpen,
    remarks,
    setRemarks,
    evidence,
    setEvidence,
    evidenceLoadToken,
    items,
    updateItem,
    totalCompleted,
    projectOptions,
    siteSelectOptions,
    siteLabel,
    submitting,
    handleSubmit,
  } = useDprForm();

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
          onChange={handleProjectChange}
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
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
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
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
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
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
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
                    { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
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
    // Bleed out of the screen's own horizontal padding so the table itself
    // reaches the screen edges instead of floating in a narrower column.
    marginHorizontal: -20,
  },
  tableRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  tableHeaderRow: {
    minHeight: 30,
    borderTopWidth: 1,
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
