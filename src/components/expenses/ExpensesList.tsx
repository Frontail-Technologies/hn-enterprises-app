import { FlashList } from '@shopify/flash-list';
import { IndianRupee, X } from 'lucide-react-native';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ExpenseCardSkeleton } from '@/components/expenses/ExpenseCardSkeleton';
import { ExpenseListItem } from '@/components/expenses/ExpenseListItem';
import { PAGINATION_OVERLAY_SPACE, PaginationOverlay } from '@/components/shared/PaginationOverlay';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { ExpenseRecord } from '@/services/expenses.service';
import { formatCount, formatCurrency } from '@/utils/format';

type ExpensesListProps = {
  isLoading: boolean;
  isError: boolean;
  isRefiltering: boolean;
  search: string;
  hasActiveFilters: boolean;
  filteredExpenses: ExpenseRecord[];
  total: number;
  recordsTotal: number;
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

export function ExpensesList({
  isLoading,
  isError,
  isRefiltering,
  search,
  hasActiveFilters,
  filteredExpenses,
  total,
  recordsTotal,
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
  const { colors } = useTheme();
  const showSpinner = filteredExpenses.length > 0 && (isFetchingNextPage || isRefiltering);
  const showRetry = filteredExpenses.length > 0 && !isFetchingNextPage && isError && hasNextPage;
  const showPaginationFooter = showSpinner || showRetry;
  const showInitialError = isError && filteredExpenses.length === 0;

  return (
    <View style={styles.listPanel}>
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

      <View style={styles.listCard}>
        {isLoading ? (
          <ExpenseCardSkeleton />
        ) : showInitialError ? (
          <ErrorState
            title="Couldn't load expenses"
            description="Check your connection and try again."
            onRetry={onRetry}
          />
        ) : (
          <FlashList
            style={styles.flex}
            showsVerticalScrollIndicator
            data={filteredExpenses}
            keyExtractor={(expense) => expense.id}
            contentContainerStyle={showPaginationFooter ? styles.listContentWithFooter : styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
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
              <ExpenseListItem expense={expense} plumberNameById={plumberNameById} onPress={onEdit} />
            )}
            ListEmptyComponent={
              <EmptyState
                fill
                icon={<IndianRupee size={22} color={colors.primary} />}
                title={
                  search.trim() || hasActiveFilters || categoryFilterLabel
                    ? 'No matching expenses'
                    : 'No expenses yet'
                }
                description={
                  search.trim() || hasActiveFilters || categoryFilterLabel
                    ? 'Try changing or clearing your search and filters.'
                    : 'Recorded expenses will appear here.'
                }
              />
            }
          />
        )}

        {/* Absolutely positioned, viewport-centered - stays put regardless
            of scroll position (see PaginationOverlay). */}
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
  listPanel: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
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
  listCard: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  resultText: {
    ...typography.caption,
  },
  separator: {
    height: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  listContentWithFooter: {
    flexGrow: 1,
    paddingBottom: spacing.md + PAGINATION_OVERLAY_SPACE,
  },
});
