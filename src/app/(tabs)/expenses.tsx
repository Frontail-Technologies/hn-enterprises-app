import { Edit3, Filter, IndianRupee, Plus, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ColumnFilterSheet } from '@/components/shared/ColumnFilterSheet';
import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useColumnFilters, type FilterableColumn } from '@/hooks/useColumnFilters';
import {
  expenseCategoryOptions,
  expensesApi,
  type ExpenseCategory,
  type ExpenseMode,
  type ExpenseRecord,
  type ExpenseStatus,
  type SiteOption,
} from '@/services/expenses.service';
import type { EvidenceFile } from '@/services/mockData';

type StatusFilter = 'All' | ExpenseStatus;

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: 'All Status', value: 'All' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const draftStatusOptions = statusOptions.filter(
  (option): option is { label: string; value: ExpenseStatus } => option.value !== 'All',
);

const modeOptions: { label: string; value: ExpenseMode }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI', value: 'upi' },
  { label: 'NEFT', value: 'neft' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Other', value: 'other' },
];

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

type Row = ExpenseRecord & { site: string };

type ExpenseColumnKey = 'purpose' | 'paidTo' | 'site' | 'amount' | 'date' | 'status';

const columns: FilterableColumn<ExpenseColumnKey>[] = [
  { key: 'purpose', label: 'Purpose' },
  { key: 'paidTo', label: 'Paid To' },
  { key: 'site', label: 'Site' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
];

type Draft = {
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  siteId: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
};

function emptyDraft(): Draft {
  return {
    category: 'other_expense',
    purpose: '',
    paidTo: '',
    siteId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'cash',
    status: 'draft',
    remarks: '',
    evidence: [],
  };
}

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftCategoryOpen, setDraftCategoryOpen] = useState(false);
  const [draftSiteOpen, setDraftSiteOpen] = useState(false);
  const [draftModeOpen, setDraftModeOpen] = useState(false);
  const [draftStatusOpen, setDraftStatusOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const [expenseRows, siteRows] = await Promise.all([expensesApi.list(), expensesApi.listSiteOptions()]);
        if (!mounted) return;
        setExpenses(expenseRows);
        setSites(siteRows);
      } catch {
        if (mounted) showToast('Unable to load expenses', 'error');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const siteNameById = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const siteSelectOptions = useMemo(
    () => sites.map((site) => ({ label: site.name, value: site.id })),
    [sites],
  );

  const rows = useMemo<Row[]>(
    () => expenses.map((expense) => ({ ...expense, site: siteNameById.get(expense.siteId) ?? '' })),
    [expenses, siteNameById],
  );

  const {
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    matchesFilters,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
  } = useColumnFilters<Row, ExpenseColumnKey>(columns, rows);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((expense) => {
      const matchesFromDate = fromDate ? expense.date >= fromDate : true;
      const matchesToDate = toDate ? expense.date <= toDate : true;
      const matchesSearch =
        !query ||
        [expense.purpose, expense.paidTo, expense.site, expense.paymentMode, expense.status]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFromDate && matchesToDate && matchesSearch && matchesFilters(expense);
    });
  }, [rows, fromDate, matchesFilters, search, toDate]);

  const total = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const openAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setSheetOpen(true);
  };

  const openEdit = (expense: ExpenseRecord) => {
    setEditingId(expense.id);
    setDraft({
      category: expense.category,
      purpose: expense.purpose,
      paidTo: expense.paidTo,
      siteId: expense.siteId,
      amount: expense.amount,
      date: expense.date,
      paymentMode: expense.paymentMode,
      status: expense.status,
      remarks: expense.remarks,
      evidence: expense.evidence,
    });
    setSheetOpen(true);
  };

  const saveExpense = async () => {
    if (!draft.purpose.trim() || !draft.amount.trim()) {
      showToast('Purpose and amount are required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await expensesApi.update(editingId, draft);
        setExpenses((current) => current.map((expense) => (expense.id === editingId ? updated : expense)));
        showToast('Expense updated', 'success');
      } else {
        const created = await expensesApi.create(draft);
        setExpenses((current) => [created, ...current]);
        showToast('Expense added', 'success');
      }
      setSheetOpen(false);
    } catch {
      showToast('Unable to save expense', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterSheetOpen(false);
  };

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
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
        <ScrollableTable
          header={
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.softOrange, borderColor: colors.border }]}>
              {columns.map((column) => {
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
          {filteredExpenses.map((expense) => (
            <Pressable
              key={expense.id}
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
                {expense.paidTo || '-'}
              </Text>
              <Text style={[styles.bodyCell, styles.siteCell, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
                {expense.site || '-'}
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
          ))}
        </ScrollableTable>
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
              label={isSaving ? 'Saving...' : editingId ? 'Save' : 'Add'}
              onPress={saveExpense}
              disabled={isSaving}
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
          <Input
            label="Paid To / Shop"
            value={draft.paidTo}
            onChangeText={(value) => updateDraft('paidTo', value)}
            placeholder="Vendor or person name"
          />
          <SimpleSelect
            label="Site Address"
            value={draft.siteId}
            options={siteSelectOptions}
            open={draftSiteOpen}
            onOpenChange={setDraftSiteOpen}
            onChange={(value) => updateDraft('siteId', value)}
            searchable
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
            options={modeOptions}
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
          <EvidenceUploader
            title="Receipt / Proof"
            initialFiles={draft.evidence}
            module="expenses"
            recordId={editingId ?? undefined}
            onChange={(files) => updateDraft('evidence', files)}
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
      <Text style={[styles.pillText, { color: textColor }]}>{STATUS_LABEL[status]}</Text>
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
    gap: spacing.sm,
    padding: spacing.sm,
  },
  resultText: {
    ...typography.caption,
    paddingHorizontal: spacing.xs,
  },
  tableRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tableHeader: {
    minHeight: 38,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  headerCell: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    minHeight: 38,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
  },
  headerCellPressable: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
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
  site: styles.siteCell,
  amount: styles.amountCell,
  date: styles.mediumCell,
  status: styles.statusCell,
};
