import { useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Edit3, Filter, IndianRupee, Plus, Search } from 'lucide-react-native';
import { Pressable, RefreshControl, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useCallback, useState, useMemo } from 'react';

import { AppHeader } from '@/components/shared/AppHeader';
import { ColumnFilterSheet } from '@/components/shared/ColumnFilterSheet';
import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import {
  useCreateExpenseMutation,
  useExpensesQuery,
  usePlumbersOptionsQuery,
  useUpdateExpenseMutation,
  useMasterValuesQuery,
} from '@/queries';
import { expenseGridColumns, expenseStatusLabels } from '@/constants/expenses';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { draftStatusOptions, useExpensesScreen } from '@/hooks/useExpensesScreen';
import { expenseCategoryOptions, type ExpenseStatus } from '@/services/expenses.service';
import type { ExpenseColumnKey } from '@/types/expenses';

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const expensesQuery = useExpensesQuery();
  const plumbersQuery = usePlumbersOptionsQuery();
  const paymentModesQuery = useMasterValuesQuery('Payment Types');
  
  const expenseModeOptions = useMemo(
    () => (paymentModesQuery.data ?? []).map((mode) => ({ label: mode, value: mode })),
    [paymentModesQuery.data]
  );

  const plumberSelectOptions = useMemo(
    () => (plumbersQuery.data ?? []).map((p) => ({ label: p.name, value: p.id })),
    [plumbersQuery.data],
  );

  const plumberNameById = useMemo(
    () => new Map((plumbersQuery.data ?? []).map((p) => [p.id, p.name])),
    [plumbersQuery.data],
  );

  const createExpenseMutation = useCreateExpenseMutation();
  const updateExpenseMutation = useUpdateExpenseMutation();

  const {
    isLoading,
    isSaving,
    expenses,
    filteredExpenses,
    total,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    draftCategoryOpen,
    setDraftCategoryOpen,
    draftPlumberOpen,
    setDraftPlumberOpen,
    draftModeOpen,
    setDraftModeOpen,
    draftStatusOpen,
    setDraftStatusOpen,
    filterSheetOpen,
    setFilterSheetOpen,
    sheetOpen,
    setSheetOpen,
    editingId,
    draft,
    openAdd,
    openEdit,
    saveExpense,
    updateDraft,
    resetFilters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
  } = useExpensesScreen();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <Screen scroll={false} tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="Expenses" subtitle="Site expenses and payment records" />

      <View style={styles.topRow}>
        <View style={styles.searchWrap}>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder="Search expenses..."
            leftIcon={<Search size={18} color={colors.muted} />}
            rightIcon={<Filter size={18} color={colors.primary} />}
            onRightIconPress={() => setFilterSheetOpen(true)}
          />
        </View>
        <Button
          label="Add"
          icon={<Plus size={16} color="#FFFFFF" />}
          onPress={openAdd}
          style={styles.addButton}
        />
      </View>

      <Card style={styles.totalCard}>
        <View style={[styles.totalIcon, { backgroundColor: colors.softOrange }]}>
          <IndianRupee size={20} color={colors.primary} />
        </View>
        <View style={styles.totalCopy}>
          <Text style={[typography.caption, { color: colors.muted }]}>Filtered Total</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>Rs. {total.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={[styles.recordCount, { color: colors.muted }]}>{filteredExpenses.length} rows</Text>
      </Card>

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          {isLoading ? 'Loading expenses...' : `Showing ${filteredExpenses.length} of ${expenses.length} records`}
        </Text>
        {isLoading ? (
          <TableSkeleton columnWidths={[150, 110, 150, 92, 110, 96, 74]} />
        ) : (
          <ScrollableTable
            listMode
            minWidth={782}
            header={
              <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.softOrange, borderColor: colors.border }]}>
                {expenseGridColumns.map((column) => {
                  const active = isColumnActive(column.key);
                  return (
                    <Pressable
                      key={column.key}
                      onPress={() => openFilter(column)}
                      style={[styles.headerCellPressable, columnWidthStyles[column.key], { borderColor: colors.border }]}
                    >
                      <Text
                        style={[styles.headerCellText, { color: active ? colors.primary : colors.muted }]}
                        numberOfLines={1}
                      >
                        {column.label}
                      </Text>
                      <Filter size={11} color={active ? colors.primary : colors.muted} />
                    </Pressable>
                  );
                })}
                <Text style={[styles.headerCell, styles.actionCell, { color: colors.muted, borderColor: colors.border }]}>Action</Text>
              </View>
            }
          >
            <FlashList
              style={styles.flex}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              data={filteredExpenses}
              keyExtractor={(expense) => expense.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primaryDark}
                  colors={[colors.primaryDark]}
                  progressBackgroundColor={colors.card}
                />
              }
              renderItem={({ item: expense }) => (
                <Reveal stagger={false}>
                  <Pressable
                    onPress={() => openEdit(expense)}
                    style={({ pressed }) => [
                      styles.tableRow,
                      { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.62 : 1 },
                    ]}
                  >
                    <View style={[styles.purposeCell, { borderColor: colors.border }]}>
                      <Text style={[styles.primaryText, { color: colors.text }]} numberOfLines={1}>
                        {expense.purpose || '-'}
                      </Text>
                      <Text style={[typography.caption, { color: colors.muted }]}>{expense.paymentMode || '-'}</Text>
                    </View>
                    <Text style={[styles.bodyCell, styles.mediumCell, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
                      {expense.category === 'plumber_payment' ? (plumberNameById.get(expense.plumberId) || expense.paidTo || '-') : (expense.paidTo || '-')}
                    </Text>
                    <Text style={[styles.bodyCell, styles.siteCell, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
                      {expense.address || '-'}
                    </Text>
                    <Text style={[styles.bodyCell, styles.amountCell, { color: colors.primary, borderColor: colors.border }]}>
                      Rs. {Number(expense.amount || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.bodyCell, styles.mediumCell, { color: colors.text, borderColor: colors.border }]}>{expense.date}</Text>
                    <View style={[styles.statusCell, { borderColor: colors.border }]}>
                      <StatusPill status={expense.status} />
                    </View>
                    <View style={[styles.actionCell, { borderColor: colors.border }]}>
                      {expense.evidence.length ? <Text style={[typography.caption, { color: colors.green }]}>{expense.evidence.length}</Text> : null}
                      <Edit3 size={15} color={colors.primary} />
                    </View>
                  </Pressable>
                </Reveal>
              )}
            />
          </ScrollableTable>
        )}
      </View>

      <Sheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter Expenses"
        footer={
          <View style={styles.sheetFooter}>
            <Button label="Reset" variant="outline" onPress={resetFilters} style={styles.footerButton} />
            <Button label="Apply" onPress={() => setFilterSheetOpen(false)} style={styles.footerButton} />
          </View>
        }
      >
        <View style={styles.form}>
          <DateField label="From Date" value={fromDate} onChangeText={setFromDate} />
          <DateField label="To Date" value={toDate} onChangeText={setToDate} />
        </View>
      </Sheet>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? 'Edit Expense' : 'Add Expense'}
        footer={
          <View style={styles.sheetFooter}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={() => setSheetOpen(false)}
              style={styles.footerButton}
            />
            <Button
              label={editingId ? 'Save' : 'Add'}
              onPress={saveExpense}
              loading={isSaving}
              style={styles.footerButton}
            />
          </View>
        }
      >
        <View style={styles.form}>
          <SimpleSelect
            label="Category"
            value={draft.category}
            options={expenseCategoryOptions}
            open={draftCategoryOpen}
            onOpenChange={setDraftCategoryOpen}
            onChange={(value) => updateDraft('category', value)}
          />
          <Input
            label="Purpose / What Bought"
            value={draft.purpose}
            onChangeText={(value) => updateDraft('purpose', value)}
            placeholder="Pipe clamp purchase"
          />
          {draft.category === 'plumber_payment' ? (
            <SimpleSelect
              label="Select Plumber"
              value={draft.plumberId}
              options={plumberSelectOptions}
              open={draftPlumberOpen}
              onOpenChange={setDraftPlumberOpen}
              onChange={(value) => updateDraft('plumberId', value)}
              searchable
            />
          ) : (
            <Input
              label="Paid To / Shop"
              value={draft.paidTo}
              onChangeText={(value) => updateDraft('paidTo', value)}
              placeholder="Vendor or person name"
            />
          )}
          <Input
            label="Site Address"
            value={draft.address}
            onChangeText={(value) => updateDraft('address', value)}
            placeholder="Site or work address"
          />
          <Input
            label="Amount"
            value={draft.amount}
            onChangeText={(value) => updateDraft('amount', value)}
            keyboardType="numeric"
            placeholder="0"
          />
          <DateField label="Expense Date" value={draft.date} onChangeText={(value) => updateDraft('date', value)} />
          <SimpleSelect
            label="Payment Mode"
            value={draft.paymentMode}
            options={expenseModeOptions}
            open={draftModeOpen}
            onOpenChange={setDraftModeOpen}
            onChange={(value) => updateDraft('paymentMode', value)}
          />
          <SimpleSelect
            label="Status"
            value={draft.status}
            options={draftStatusOptions}
            open={draftStatusOpen}
            onOpenChange={setDraftStatusOpen}
            onChange={(value) => updateDraft('status', value)}
          />
          <Input
            label="Remarks (Optional)"
            value={draft.remarks}
            onChangeText={(value) => updateDraft('remarks', value)}
            placeholder="Any additional notes"
          />
          <EvidenceUploader
            title="Receipt / Proof"
            initialFiles={draft.evidence}
            module="expenses"
            recordId={editingId ?? undefined}
            onChange={(files) => updateDraft('evidence', files)}
            deferUpload
          />
          <Input
            label="Remarks"
            value={draft.remarks}
            onChangeText={(value) => updateDraft('remarks', value)}
            placeholder="Add notes"
            multiline
          />
        </View>
      </Sheet>

      <ColumnFilterSheet
        activeColumn={activeColumn}
        activeValues={activeValues}
        pendingValues={pendingValues}
        filterSearch={filterSearch}
        onSearchChange={setFilterSearch}
        onToggleValue={togglePendingValue}
        onClose={closeFilter}
        onClear={clearFilter}
        onApply={applyFilter}
      />
    </Screen>
  );
}

function StatusPill({ status }: { status: ExpenseStatus }) {
  const { colors } = useTheme();
  const tint =
    status === 'approved'
      ? colors.softBlue
      : status === 'rejected'
        ? colors.softOrange
        : status === 'submitted'
          ? colors.softBlue
          : colors.softOrange;
  const textColor =
    status === 'approved'
      ? colors.green
      : status === 'rejected'
        ? colors.red
        : status === 'submitted'
          ? colors.blue
          : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: tint }]}>
      <Text style={[styles.pillText, { color: textColor }]}>{expenseStatusLabels[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  totalCard: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  totalIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  totalCopy: {
    flex: 1,
  },
  totalValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 23,
    lineHeight: 29,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchWrap: {
    flex: 1,
    minWidth: 0,
  },
  recordCount: {
    ...typography.caption,
  },
  addButton: {
    width: 88,
  },
  tablePanel: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    // Bleed out of the screen's own horizontal padding so the table itself
    // reaches the screen edges instead of floating in a narrower column.
    marginHorizontal: -20,
  },
  flex: {
    flex: 1,
  },
  resultText: {
    ...typography.caption,
    paddingHorizontal: 20,
  },
  tableRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  tableHeader: {
    minHeight: 28,
    borderTopWidth: 1,
  },
  headerCell: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    minHeight: 28,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  headerCellPressable: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerCellText: {
    ...typography.caption,
    flex: 1,
    fontSize: 10,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  bodyCell: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: spacing.sm,
  },
  primaryText: {
    ...typography.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  purposeCell: {
    width: 150,
    gap: 1,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
  },
  mediumCell: {
    width: 110,
    borderRightWidth: 1,
  },
  siteCell: {
    width: 150,
    borderRightWidth: 1,
  },
  amountCell: {
    width: 92,
    borderRightWidth: 1,
  },
  statusCell: {
    width: 96,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
  },
  actionCell: {
    width: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pillText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
  form: {
    gap: spacing.md,
  },
});

const columnWidthStyles: Record<ExpenseColumnKey, StyleProp<ViewStyle>> = {
  purpose: styles.purposeCell,
  paidTo: styles.mediumCell,
  address: styles.siteCell,
  amount: styles.amountCell,
  date: styles.mediumCell,
  status: styles.statusCell,
};
