import { Camera, Edit3, Filter, IndianRupee, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ColumnFilterSheet } from '@/components/shared/ColumnFilterSheet';
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

type ExpenseStatus = 'All' | 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
type SiteAddress = 'All' | 'Radha Nagar' | 'Shyam Nagar Block A' | 'Shyam Nagar Block B';

type ExpenseRecord = {
  id: string;
  purpose: string;
  paidTo: string;
  siteAddress: string;
  amount: string;
  date: string;
  paymentMode: string;
  status: Exclude<ExpenseStatus, 'All'>;
  remarks: string;
  attachment: boolean;
};

const statusOptions: { label: string; value: ExpenseStatus }[] = [
  { label: 'All Status', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'Submitted', value: 'Submitted' },
  { label: 'Approved', value: 'Approved' },
  { label: 'Rejected', value: 'Rejected' },
];

const siteOptions: { label: string; value: SiteAddress }[] = [
  { label: 'All Sites', value: 'All' },
  { label: 'Radha Nagar', value: 'Radha Nagar' },
  { label: 'Shyam Nagar Block A', value: 'Shyam Nagar Block A' },
  { label: 'Shyam Nagar Block B', value: 'Shyam Nagar Block B' },
];

const formSiteOptions = siteOptions.filter(
  (option): option is { label: string; value: Exclude<SiteAddress, 'All'> } => option.value !== 'All',
);

type ExpenseColumnKey = keyof Pick<ExpenseRecord, 'purpose' | 'paidTo' | 'siteAddress' | 'amount' | 'date' | 'status'>;

const columns: FilterableColumn<ExpenseColumnKey>[] = [
  { key: 'purpose', label: 'Purpose' },
  { key: 'paidTo', label: 'Paid To' },
  { key: 'siteAddress', label: 'Site' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
];

const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp-001',
    purpose: 'Pipe clamp purchase',
    paidTo: 'Jabed Hardware',
    siteAddress: 'Radha Nagar',
    amount: '1250',
    date: '2026-07-21',
    paymentMode: 'Cash',
    status: 'Submitted',
    remarks: 'Bought clamps for GI work.',
    attachment: true,
  },
  {
    id: 'exp-002',
    purpose: 'Material transport',
    paidTo: 'Mukesh Transport',
    siteAddress: 'Shyam Nagar Block A',
    amount: '850',
    date: '2026-07-20',
    paymentMode: 'UPI',
    status: 'Draft',
    remarks: 'Tempo charge for material movement.',
    attachment: false,
  },
  {
    id: 'exp-003',
    purpose: 'Plumber payment',
    paidTo: 'Group A',
    siteAddress: 'Shyam Nagar Block B',
    amount: '3400',
    date: '2026-07-19',
    paymentMode: 'Cash',
    status: 'Approved',
    remarks: 'Daily labour payment.',
    attachment: true,
  },
];

const emptyDraft: ExpenseRecord = {
  id: '',
  purpose: '',
  paidTo: '',
  siteAddress: '',
  amount: '',
  date: '2026-07-22',
  paymentMode: '',
  status: 'Draft',
  remarks: '',
  attachment: false,
};

export default function ExpensesScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState(initialExpenses);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftSiteOpen, setDraftSiteOpen] = useState(false);
  const [draftStatusOpen, setDraftStatusOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExpenseRecord>(emptyDraft);

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
  } = useColumnFilters<ExpenseRecord, ExpenseColumnKey>(columns, expenses);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesFromDate = fromDate ? expense.date >= fromDate : true;
      const matchesToDate = toDate ? expense.date <= toDate : true;
      const matchesSearch =
        !query ||
        [expense.purpose, expense.paidTo, expense.siteAddress, expense.paymentMode, expense.status]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFromDate && matchesToDate && matchesSearch && matchesFilters(expense);
    });
  }, [expenses, fromDate, matchesFilters, search, toDate]);

  const total = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const openAdd = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft, siteAddress: 'Radha Nagar' });
    setSheetOpen(true);
  };

  const openEdit = (expense: ExpenseRecord) => {
    setEditingId(expense.id);
    setDraft(expense);
    setSheetOpen(true);
  };

  const saveExpense = () => {
    if (!draft.purpose.trim() || !draft.amount.trim()) {
      showToast('Purpose and amount are required', 'error');
      return;
    }

    if (editingId) {
      setExpenses((current) =>
        current.map((expense) => (expense.id === editingId ? { ...draft, id: editingId } : expense)),
      );
      showToast('Expense updated', 'success');
    } else {
      const nextNumber = expenses.length + 1;
      setExpenses((current) => [
        { ...draft, id: `exp-${String(nextNumber).padStart(3, '0')}` },
        ...current,
      ]);
      showToast('Expense added', 'success');
    }

    setSheetOpen(false);
  };

  const updateDraft = (key: keyof ExpenseRecord, value: string | boolean) => {
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
          Showing {filteredExpenses.length} of {expenses.length} records
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
                  {expense.purpose}
                </Text>
                <Text style={[typography.caption, { color: colors.muted }]}>{expense.paymentMode || '-'}</Text>
              </View>
              <Text style={[styles.bodyCell, styles.mediumCell, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
                {expense.paidTo || '-'}
              </Text>
              <Text style={[styles.bodyCell, styles.siteCell, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
                {expense.siteAddress || '-'}
              </Text>
              <Text style={[styles.bodyCell, styles.amountCell, { color: colors.primary, borderColor: colors.border }]}>
                Rs. {Number(expense.amount || 0).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.bodyCell, styles.mediumCell, { color: colors.text, borderColor: colors.border }]}>{expense.date}</Text>
              <View style={[styles.statusCell, { borderColor: colors.border }]}>
                <StatusPill status={expense.status} />
              </View>
              <View style={[styles.actionCell, { borderColor: colors.border }]}>
                {expense.attachment ? <Camera size={15} color={colors.green} /> : null}
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
            <Button label={editingId ? 'Save' : 'Add'} onPress={saveExpense} style={styles.footerButton} />
          </View>
        }
      >
        <View style={styles.form}>
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
            value={draft.siteAddress as Exclude<SiteAddress, 'All'>}
            options={formSiteOptions}
            open={draftSiteOpen}
            onOpenChange={setDraftSiteOpen}
            onChange={(value) => updateDraft('siteAddress', value)}
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
          <Input
            label="Payment Mode"
            value={draft.paymentMode}
            onChangeText={(value) => updateDraft('paymentMode', value)}
            placeholder="Cash / UPI / Bank"
          />
          <SimpleSelect
            label="Status"
            value={draft.status}
            options={statusOptions.filter(
              (option): option is { label: string; value: ExpenseRecord['status'] } => option.value !== 'All',
            )}
            open={draftStatusOpen}
            onOpenChange={setDraftStatusOpen}
            onChange={(value) => updateDraft('status', value)}
          />
          <Pressable
            onPress={() => updateDraft('attachment', !draft.attachment)}
            style={({ pressed }) => [
              styles.receiptButton,
              { borderColor: draft.attachment ? colors.primary : colors.border, backgroundColor: colors.card },
              pressed && { opacity: 0.78 },
            ]}
          >
            <Camera size={17} color={draft.attachment ? colors.primary : colors.muted} />
            <Text style={[styles.receiptText, { color: draft.attachment ? colors.primary : colors.text }]}>
              {draft.attachment ? 'Receipt attached' : 'Attach receipt photo'}
            </Text>
          </Pressable>
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

function StatusPill({ status }: { status: ExpenseRecord['status'] }) {
  const { colors } = useTheme();
  const tint =
    status === 'Approved'
      ? colors.softBlue
      : status === 'Rejected'
        ? colors.softOrange
        : status === 'Submitted'
          ? colors.softBlue
          : colors.softOrange;
  const textColor =
    status === 'Approved'
      ? colors.green
      : status === 'Rejected'
        ? colors.red
        : status === 'Submitted'
          ? colors.blue
          : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: tint }]}>
      <Text style={[styles.pillText, { color: textColor }]}>{status}</Text>
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
  receiptButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  receiptText: {
    ...typography.bodyMedium,
    fontSize: 13,
  },
});

const columnWidthStyles: Record<ExpenseColumnKey, StyleProp<ViewStyle>> = {
  purpose: styles.purposeCell,
  paidTo: styles.mediumCell,
  siteAddress: styles.siteCell,
  amount: styles.amountCell,
  date: styles.mediumCell,
  status: styles.statusCell,
};
