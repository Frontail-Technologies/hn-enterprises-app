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
  // Search/filter controls themselves now live in AppHeader (see
  // expenses.tsx) - this screen only needs the current values, to drive its
  // own result-count text and empty-state messaging.
  search: string;
  // Only for the empty-state message's "no matches" vs "nothing yet" copy -
  // the actual filter controls live in AppHeader now.
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
  // Cached rows stay on screen during a filter/search refetch (isRefiltering)
  // instead of being replaced by the full skeleton - this overlay is the
  // only signal that a new result is on the way, same as the next-page spinner.
  const showSpinner = filteredExpenses.length > 0 && (isFetchingNextPage || isRefiltering);
  const showRetry = filteredExpenses.length > 0 && !isFetchingNextPage && isError && hasNextPage;
  const showPaginationFooter = showSpinner || showRetry;
  // Only the initial load (no rows yet) gets the full-page ErrorState - a
  // later page failing keeps the rows visible and surfaces a footer retry
  // instead (PaginationOverlay below).
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
  // flexGrow (not flex): lets the content area grow to fill the viewport
  // when content is shorter than it (the empty state), which is what the
  // EmptyState's own `fill` (flex: 1) needs to actually have space to
  // center within. No-op once real rows make the content taller than the
  // viewport, so this doesn't affect normal scrolling.
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  // Extra bottom space so the last row never sits underneath the viewport-
  // centered PaginationOverlay (see the listCard wrapper above).
  listContentWithFooter: {
    flexGrow: 1,
    paddingBottom: spacing.md + PAGINATION_OVERLAY_SPACE,
  },
});
