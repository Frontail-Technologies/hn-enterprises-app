import { ChevronRight } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { expenseStatusLabels, formatExpenseCategory, formatExpenseMode } from '@/constants/expenses';
import { getExpenseCategoryVisual } from '@/constants/expenseVisuals';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { ExpenseRecord, ExpenseStatus } from '@/services/expenses.service';
import { formatCurrency, formatDate } from '@/utils/format';

type ExpenseListItemProps = {
  expense: ExpenseRecord;
  plumberNameById: Map<string, string>;
  onPress: (expense: ExpenseRecord) => void;
};

export const ExpenseListItem = memo(function ExpenseListItem({
  expense,
  plumberNameById,
  onPress,
}: ExpenseListItemProps) {
  const { colors } = useTheme();
  const visual = getExpenseCategoryVisual(expense.category);
  const Icon = visual.icon;
  const tint = colors[visual.colorKey];

  const resolvedPaidTo =
    expense.category === 'plumber_payment'
      ? plumberNameById.get(expense.plumberId) || expense.paidTo
      : expense.paidTo;
  const title = expense.purpose || resolvedPaidTo || formatExpenseCategory(expense.category);

  return (
    <AnimatedPressable
      onPress={() => onPress(expense)}
      scaleTo={0.99}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${tint}1F` }]}>
        <Icon size={18} color={tint} />
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1}>
            {formatCurrency(expense.amount, { round: false })}
          </Text>
        </View>

        {/* Only when the expense is actually linked to a customer - most
            categories (worker/rent/material) never carry one, and an empty
            row here would just be dead space. */}
        {expense.customerName ? (
          <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
            {expense.customerName}
          </Text>
        ) : null}

        <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
          {formatExpenseCategory(expense.category)} • {formatDate(expense.date)} • {formatExpenseMode(expense.paymentMode)}
        </Text>

        <View style={styles.bottomRow}>
          <StatusPill status={expense.status} />
          <ChevronRight size={16} color={colors.muted} />
        </View>
      </View>
    </AnimatedPressable>
  );
});

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
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 19,
  },
  amount: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  customerName: {
    ...typography.label,
    fontSize: 12.5,
    lineHeight: 17,
  },
  meta: {
    ...typography.caption,
    fontSize: 11.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  pillText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
});
