import { IndianRupee } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DonutChart } from '@/components/expenses/DonutChart';
import { formatExpenseCategory } from '@/constants/expenses';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getExpenseCategoryVisual } from '@/constants/expenseVisuals';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FilterButton } from '@/components/shared/FilterButton';
import { RevealGroup } from '@/components/ui/RevealGroup';
import { Skeleton } from '@/components/ui/Skeleton';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { useTheme } from '@/context/ThemeContext';
import type { CategoryBreakdownItem } from '@/hooks/useExpensesOverview';
import type { ExpenseCategory, ExpenseRecord } from '@/services/expenses.service';
import { formatCurrency, formatDate } from '@/utils/format';

const EM_DASH = '—';
const DONUT_SIZE = 188;
// Blended toward white for the donut ring only - the category rows below
// keep the full-saturation color for their icon/tint, this just lightens
// the chart itself, which read too dark/heavy at full strength.
const DONUT_LIGHTEN_AMOUNT = 0.32;

function lightenHex(hex: string, amount: number) {
  const num = parseInt(hex.replace('#', ''), 16);
  const channel = (shift: number) => {
    const value = (num >> shift) & 0xff;
    return Math.round(value + (255 - value) * amount);
  };
  return `#${[channel(16), channel(8), channel(0)].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

type MonthOption = { label: string; value: string };

type ExpensesOverviewProps = {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  hasAnyExpenses: boolean;
  monthOptions: MonthOption[];
  monthFilter: string;
  onMonthChange: (value: string) => void;
  monthSelectOpen: boolean;
  onMonthSelectOpenChange: (open: boolean) => void;
  filterCount: number;
  onFilterPress: () => void;
  filteredTotal: number;
  categoryBreakdown: CategoryBreakdownItem[];
  recentExpenses: ExpenseRecord[];
  plumberNameById: Map<string, string>;
  onCategoryPress: (category: ExpenseCategory) => void;
  onViewAllPress: () => void;
};

export function ExpensesOverview({
  isLoading,
  isError,
  onRetry,
  refreshing,
  onRefresh,
  hasAnyExpenses,
  monthOptions,
  monthFilter,
  onMonthChange,
  monthSelectOpen,
  onMonthSelectOpenChange,
  filterCount,
  onFilterPress,
  filteredTotal,
  categoryBreakdown,
  recentExpenses,
  plumberNameById,
  onCategoryPress,
  onViewAllPress,
}: ExpensesOverviewProps) {
  const { colors } = useTheme();
  const hasResults = categoryBreakdown.length > 0;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryDark}
          colors={[colors.primaryDark]}
          progressBackgroundColor={colors.card}
        />
      }
    >
      <View style={styles.filterRow}>
        <View style={styles.monthWrap}>
          <SimpleSelect
            compact
            label="Month"
            value={monthFilter}
            options={monthOptions}
            open={monthSelectOpen}
            onOpenChange={onMonthSelectOpenChange}
            onChange={onMonthChange}
          />
        </View>
        <FilterButton activeCount={filterCount} onPress={onFilterPress} />
      </View>

      {isLoading ? (
        <OverviewSkeleton />
      ) : isError ? (
        <ErrorState fill title="Couldn't load expenses" description="Check your connection and try again." onRetry={onRetry} />
      ) : !hasAnyExpenses ? (
        <EmptyState
          fill
          icon={<IndianRupee size={22} color={colors.primary} />}
          title="No expenses yet"
          description="Expenses added for your projects will appear here."
        />
      ) : !hasResults ? (
        <EmptyState
          fill
          icon={<IndianRupee size={22} color={colors.primary} />}
          title="No expenses found"
          description="Try changing your filters."
        />
      ) : (
        <RevealGroup>
          <Card style={styles.totalCard}>
            <DonutChart
              size={DONUT_SIZE}
              trackColor={colors.border}
              segments={categoryBreakdown.map((item) => ({
                key: item.category,
                value: item.total,
                color: lightenHex(colors[getExpenseCategoryVisual(item.category).colorKey], DONUT_LIGHTEN_AMOUNT),
              }))}
            >
              <Text style={[styles.totalValue, { color: colors.text }]} numberOfLines={1}>
                {formatCurrency(filteredTotal)}
              </Text>
              <Text style={[styles.totalLabel, { color: colors.muted }]}>Total Expenses</Text>
            </DonutChart>
          </Card>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
            <Card style={styles.listCard}>
              {categoryBreakdown.map((item, index) => (
                <CategoryRow
                  key={item.category}
                  item={item}
                  last={index === categoryBreakdown.length - 1}
                  onPress={() => onCategoryPress(item.category)}
                />
              ))}
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Expenses</Text>
              <Pressable onPress={onViewAllPress} hitSlop={8}>
                <Text style={[typography.label, { color: colors.primary }]}>View all</Text>
              </Pressable>
            </View>
            <Card style={styles.listCard}>
              {recentExpenses.map((expense, index) => (
                <RecentExpenseRow
                  key={expense.id}
                  expense={expense}
                  plumberNameById={plumberNameById}
                  last={index === recentExpenses.length - 1}
                />
              ))}
            </Card>
          </View>
        </RevealGroup>
      )}
    </ScrollView>
  );
}

function CategoryRow({
  item,
  last,
  onPress,
}: {
  item: CategoryBreakdownItem;
  last: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const visual = getExpenseCategoryVisual(item.category);
  const Icon = visual.icon;
  const tint = colors[visual.colorKey];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${tint}1F` }]}>
        <Icon size={18} color={tint} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={[styles.rowCount, { color: colors.muted }]}>
          {item.count} {item.count === 1 ? 'expense' : 'expenses'}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: colors.text }]} numberOfLines={1}>
        {formatCurrency(item.total)}
      </Text>
    </Pressable>
  );
}

function RecentExpenseRow({
  expense,
  plumberNameById,
  last,
}: {
  expense: ExpenseRecord;
  plumberNameById: Map<string, string>;
  last: boolean;
}) {
  const { colors } = useTheme();
  const paidTo =
    expense.category === 'plumber_payment'
      ? plumberNameById.get(expense.plumberId) || expense.paidTo || EM_DASH
      : expense.paidTo || EM_DASH;
  const meta = [formatDate(expense.date), expense.address || null].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        styles.recentRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
        {formatExpenseCategory(expense.category)}
      </Text>
      <View style={styles.recentMidRow}>
        <Text style={[styles.recentPaidTo, { color: colors.text }]} numberOfLines={1}>
          {paidTo}
        </Text>
        <Text style={[styles.recentAmount, { color: colors.primary }]} numberOfLines={1}>
          {formatCurrency(expense.amount)}
        </Text>
      </View>
      <Text style={[styles.recentMeta, { color: colors.muted }]} numberOfLines={1}>
        {meta}
      </Text>
    </View>
  );
}

function OverviewSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonDonutRow}>
        <Skeleton width={DONUT_SIZE} height={DONUT_SIZE} borderRadius={DONUT_SIZE / 2} />
      </View>
      <Skeleton width={90} height={13} style={styles.skeletonSectionTitle} />
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} height={60} borderRadius={radius.lg} style={styles.skeletonRow} />
      ))}
      <Skeleton width={130} height={13} style={styles.skeletonSectionTitle} />
      {[0, 1].map((row) => (
        <Skeleton key={row} height={58} borderRadius={radius.lg} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // flexGrow (not flex) so the empty/error state's own `fill` (flex: 1)
  // has real space to center within instead of the ScrollView's content
  // collapsing to just the filter row's height. No-op once real content
  // exceeds the viewport.
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  monthWrap: {
    flex: 1,
    minWidth: 0,
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: 26,
  },
  totalValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 26,
    lineHeight: 32,
  },
  totalLabel: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 15,
    lineHeight: 20,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13.5,
    lineHeight: 17,
  },
  rowCount: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 15,
  },
  rowAmount: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13.5,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  recentRow: {
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recentMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recentPaidTo: {
    flex: 1,
    minWidth: 0,
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    lineHeight: 15,
  },
  recentAmount: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13.5,
    lineHeight: 17,
    fontVariant: ['tabular-nums'],
  },
  recentMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11.5,
    lineHeight: 15,
  },
  skeletonWrap: {
    gap: spacing.md,
  },
  skeletonDonutRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  skeletonSectionTitle: {
    marginTop: spacing.sm,
  },
  skeletonRow: {
    width: '100%',
  },
});
