import { Pressable, StyleSheet, Text, View } from 'react-native';

import { expenseStatusLabels, formatExpenseCategory, formatExpenseMode } from '@/constants/expenses';
import { radius, spacing } from '@/constants/spacing';
import { tableDividers, tableMetrics, tableText } from '@/constants/table';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { ExpenseRecord, ExpenseStatus } from '@/services/expenses.service';
import { formatCurrency } from '@/utils/format';

export const EXPENSE_COL_WIDTH = {
  category: 128,
  paidTo: 130,
  amount: 92,
  date: 98,
  purpose: 148,
  mode: 88,
  address: 178,
  status: 94,
};

export const EXPENSE_TABLE_COLUMNS: {
  key: keyof typeof EXPENSE_COL_WIDTH;
  label: string;
}[] = [
  { key: 'category', label: 'Category' },
  { key: 'paidTo', label: 'Paid To' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'mode', label: 'Mode' },
  { key: 'address', label: 'Address' },
  { key: 'status', label: 'Status' },
];

export const EXPENSE_TABLE_WIDTH = Object.values(EXPENSE_COL_WIDTH).reduce(
  (total, width) => total + width,
  0,
);

export type ExpenseColumns = Record<keyof typeof EXPENSE_COL_WIDTH, number>;

export function resolveExpenseColumns(containerWidth: number): {
  columns: ExpenseColumns;
  tableWidth: number;
} {
  const fits = containerWidth >= EXPENSE_TABLE_WIDTH;
  const extra = fits ? containerWidth - EXPENSE_TABLE_WIDTH : 0;
  const categoryExtra = Math.round(extra * 0.08);
  const paidToExtra = Math.round(extra * 0.14);
  const purposeExtra = Math.round(extra * 0.42);
  const addressExtra = extra - categoryExtra - paidToExtra - purposeExtra;
  return {
    tableWidth: fits ? containerWidth : EXPENSE_TABLE_WIDTH,
    columns: {
      category: EXPENSE_COL_WIDTH.category + categoryExtra,
      paidTo: EXPENSE_COL_WIDTH.paidTo + paidToExtra,
      amount: EXPENSE_COL_WIDTH.amount,
      date: EXPENSE_COL_WIDTH.date,
      purpose: EXPENSE_COL_WIDTH.purpose + purposeExtra,
      mode: EXPENSE_COL_WIDTH.mode,
      address: EXPENSE_COL_WIDTH.address + addressExtra,
      status: EXPENSE_COL_WIDTH.status,
    },
  };
}

const EM_DASH = '—';

export function ExpenseTableRow({
  expense,
  plumberNameById,
  onEdit,
  columns,
}: {
  expense: ExpenseRecord;
  plumberNameById: Map<string, string>;
  onEdit: (expense: ExpenseRecord) => void;
  columns: ExpenseColumns;
}) {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const paidTo =
    expense.category === 'plumber_payment'
      ? plumberNameById.get(expense.plumberId) || expense.paidTo || EM_DASH
      : expense.paidTo || EM_DASH;

  return (
    <Pressable
      onPress={() => onEdit(expense)}
      style={({ pressed }) => [
        styles.tableRow,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          opacity: pressed ? 0.62 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.category, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.categoryText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formatExpenseCategory(expense.category)}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.paidTo, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.strongText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {paidTo}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.amount, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.amountText, { color: colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formatCurrency(expense.amount, { round: false })}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.date, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {expense.date || EM_DASH}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.purpose, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {expense.purpose || EM_DASH}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.mode, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {formatExpenseMode(expense.paymentMode)}
        </Text>
      </View>
      <View
        style={[
          styles.cell,
          styles.cellDivider,
          { width: columns.address, borderRightColor: dividers.vertical },
        ]}
      >
        <Text
          style={[styles.mutedText, { color: colors.muted }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {expense.address || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, { width: columns.status }]}>
        <StatusPill status={expense.status} />
      </View>
    </Pressable>
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
      <Text style={[styles.pillText, { color: textColor }]}>
        {expenseStatusLabels[status]}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  tableRow: {
    height: tableMetrics.rowHeight,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    height: tableMetrics.headerHeight,
    borderBottomWidth: 1,
  },
  headerText: {
    ...tableText.header,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: tableMetrics.cellPaddingH,
  },
  cellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  categoryText: {
    ...tableText.medium,
  },
  strongText: {
    ...tableText.primary,
  },
  amountText: {
    ...tableText.primary,
    fontVariant: ['tabular-nums'],
  },
  mutedText: {
    ...tableText.secondary,
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
});
