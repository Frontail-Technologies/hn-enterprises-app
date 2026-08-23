import { FlashList } from '@shopify/flash-list';
import { IndianRupee, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EXPENSE_TABLE_COLUMNS, ExpenseTableRow, resolveExpenseColumns, styles as rowStyles } from '@/components/expenses/ExpenseTableRow';
import { FilterButton } from '@/components/shared/FilterButton';
import { PAGINATION_OVERLAY_SPACE, PaginationOverlay } from '@/components/shared/PaginationOverlay';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { radius, spacing } from '@/constants/spacing';
import { tableMetrics, tableDividers } from '@/constants/table';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { ExpenseRecord } from '@/services/expenses.service';
import { formatCount, formatCurrency } from '@/utils/format';

type ExpensesListProps = {
  isLoading: boolean;
  isError: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filteredExpenses: ExpenseRecord[];
  total: number;
  recordsTotal: number;
  filterCount: number;
  onFilterPress: () => void;
  categoryFilterLabel: string | null;
  onClearCategoryFilter: () => void;
  plumberNameById: Map<string, string>;
  onEdit: (expense: ExpenseRecord) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
};

// Column widths are recalculated from this view's own measured width, so
// that state lives here rather than in the route screen.
export function ExpensesList({
  isLoading,
  isError,
  search,
  onSearchChange,
  filteredExpenses,
  total,
  recordsTotal,
  filterCount,
  onFilterPress,
  categoryFilterLabel,
  onClearCategoryFilter,
  plumberNameById,
  onEdit,
  refreshing,
  onRefresh,
  onRetry,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: ExpensesListProps) {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const [containerWidth, setContainerWidth] = useState(0);
  const { columns, tableWidth } = resolveExpenseColumns(containerWidth);
  const showSpinner = filteredExpenses.length > 0 && isFetchingNextPage;
  const showRetry = filteredExpenses.length > 0 && !isFetchingNextPage && isError && hasNextPage;
  const showPaginationFooter = showSpinner || showRetry;
  // Only the initial load (no rows yet) gets the full-page ErrorState - a
  // later page failing keeps the rows visible and surfaces a footer retry
  // instead (PaginationOverlay below).
  const showInitialError = isError && filteredExpenses.length === 0;

  return (
    <View style={styles.tablePanel}>
      <View style={styles.topRow}>
        <View style={styles.searchWrap}>
          <Input
            value={search}
            onChangeText={onSearchChange}
            placeholder="Search expenses..."
            leftIcon={<Search size={18} color={colors.muted} />}
          />
        </View>
        <FilterButton activeCount={filterCount} onPress={onFilterPress} />
      </View>

      {categoryFilterLabel ? (
        <Pressable
          onPress={onClearCategoryFilter}
          style={({ pressed }) => [
            styles.categoryChip,
            {
              backgroundColor: colors.softOrange,
              borderColor: colors.primary,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[typography.caption, { color: colors.primary }]}>
            Category: {categoryFilterLabel}
          </Text>
          <X size={14} color={colors.primary} />
        </Pressable>
      ) : null}

      <Text style={[styles.resultText, { color: colors.muted }]}>
        {isLoading
          ? 'Loading expenses...'
          : `${formatCount(filteredExpenses.length, recordsTotal, 'expenses')} · ${formatCurrency(total)}`}
      </Text>

      <View
        style={styles.tableCard}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        {isLoading ? (
          <TableSkeleton
            columnWidths={Object.values(columns)}
            rowHeight={tableMetrics.rowHeight}
            headerHeight={tableMetrics.headerHeight}
          />
        ) : showInitialError ? (
          <ErrorState
            title="Couldn't load expenses"
            description="Check your connection and try again."
            onRetry={onRetry}
          />
        ) : (
          <ScrollableTable
            listMode
            minWidth={tableWidth}
            header={
              <View
                style={[
                  rowStyles.tableRow,
                  rowStyles.tableHeader,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderBottomColor: dividers.header,
                  },
                ]}
              >
                {EXPENSE_TABLE_COLUMNS.map((column, index) => (
                  <View
                    key={column.key}
                    style={[
                      rowStyles.cell,
                      index < EXPENSE_TABLE_COLUMNS.length - 1 && rowStyles.cellDivider,
                      {
                        width: columns[column.key],
                        borderRightColor: dividers.vertical,
                      },
                    ]}
                  >
                    <Text style={[rowStyles.headerText, { color: colors.muted }]} numberOfLines={1}>
                      {column.label}
                    </Text>
                  </View>
                ))}
              </View>
            }
          >
            <FlashList
              style={styles.flex}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              data={filteredExpenses}
              keyExtractor={(expense) => expense.id}
              contentContainerStyle={showPaginationFooter ? styles.listContentWithFooter : styles.listContent}
              onEndReachedThreshold={0.4}
              onEndReached={onLoadMore}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primaryDark}
                  colors={[colors.primaryDark]}
                  progressBackgroundColor={colors.card}
                />
              }
              renderItem={({ item: expense }) => (
                <ExpenseTableRow
                  expense={expense}
                  plumberNameById={plumberNameById}
                  onEdit={onEdit}
                  columns={columns}
                />
              )}
              ListEmptyComponent={
                <EmptyState
                  fill
                  icon={<IndianRupee size={22} color={colors.primary} />}
                  title={
                    search.trim() || filterCount > 0 || categoryFilterLabel
                      ? 'No matching expenses'
                      : 'No expenses yet'
                  }
                  description={
                    search.trim() || filterCount > 0 || categoryFilterLabel
                      ? 'Try changing or clearing your search and filters.'
                      : 'Recorded expenses will appear here.'
                  }
                />
              }
            />
          </ScrollableTable>
        )}

        {/* Sibling of the horizontally-scrollable ScrollableTable, not a
            child of it - stays centered on the device viewport regardless
            of horizontal scroll position (see PaginationOverlay). */}
        <PaginationOverlay
          isFetchingNextPage={showSpinner}
          showRetry={showRetry}
          onRetry={onLoadMore}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tablePanel: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
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
  categoryChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 32,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  // No visible card chrome here on purpose - the header row's border and each
  // row's own hairline divider give it enough structure; a bordered/filled
  // outer box would extend a big empty surface below the last record.
  tableCard: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  resultText: {
    ...typography.caption,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  // Extra bottom space so the last row never sits underneath the viewport-
  // centered PaginationOverlay (see the tableCard wrapper above).
  listContentWithFooter: {
    paddingBottom: spacing.md + PAGINATION_OVERLAY_SPACE,
  },
});
