import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft, Search, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { PAGINATION_OVERLAY_SPACE, PaginationOverlay } from '@/components/shared/PaginationOverlay';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { tableDividers, tableMetrics, tableText } from '@/constants/table';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useStatDetailFilters } from '@/hooks/useStatDetailFilters';
import { useSupervisorStatDetails } from '@/hooks/useMobileStats';
import { guardNavigation } from '@/lib/navigation';
import { useSupervisorStatsQuery } from '@/queries';
import type { SupervisorStatDetailRow } from '@/services/mobileStats';
import { formatCount } from '@/utils/format';

const EM_DASH = '—';

const STAT_COL_WIDTH = {
  reference: 112,
  name: 150,
  address: 200,
  status: 112,
};

const STAT_TABLE_WIDTH = Object.values(STAT_COL_WIDTH).reduce((total, width) => total + width, 0);

export default function StatDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: stats = [] } = useSupervisorStatsQuery();
  const stat = stats.find((item) => item.id === type) ?? null;
  const { rows, total, isLoading, isFetchingNextPage, hasNextPage, loadMore, refetch, error } = useSupervisorStatDetails(
    type ? String(type) : undefined,
  );
  const { search, setSearch, filteredRows } = useStatDetailFilters(rows);
  const hasFilter = Boolean(search.trim());
  const showSpinner = filteredRows.length > 0 && isFetchingNextPage;
  const showRetry = filteredRows.length > 0 && !isFetchingNextPage && Boolean(error) && hasNextPage;
  const showPaginationFooter = showSpinner || showRetry;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={styles.screen} revealContent={false}>
      <AppHeader
        title={stat?.label ?? 'Stat Details'}
        subtitle={`${filteredRows.length} records`}
        left={<BackButton />}
        actions={
          searchOpen
            ? undefined
            : [
                {
                  key: 'search',
                  icon: Search,
                  accessibilityLabel: 'Search records',
                  active: hasFilter,
                  onPress: () => setSearchOpen(true),
                },
              ]
        }
        bottomContent={
          searchOpen ? (
            <View style={styles.expandedRow}>
              <Pressable onPress={() => setSearchOpen(false)} style={styles.headerButton}>
                <ChevronLeft size={20} color="#FFFFFF" />
              </Pressable>
              <View style={styles.expandedContent}>
                <Input
                  autoFocus
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search BP/TR, customer, address or site..."
                  leftIcon={<Search size={18} color={colors.muted} />}
                  rightIcon={search ? <X size={16} color={colors.muted} /> : undefined}
                  onRightIconPress={() => setSearch('')}
                />
              </View>
            </View>
          ) : undefined
        }
      />

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          {isLoading ? 'Loading…' : formatCount(filteredRows.length, total, 'records')}
        </Text>
        <View style={styles.tableCard}>
          {isLoading ? (
            <TableSkeleton
              columnWidths={Object.values(STAT_COL_WIDTH)}
              rowHeight={tableMetrics.rowHeight}
              headerHeight={tableMetrics.headerHeight}
            />
          ) : error && filteredRows.length === 0 ? (
            <ErrorState title="Couldn't load records" description="Check your connection and try again." onRetry={refetch} />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              title={hasFilter ? 'No matching records' : 'No data found'}
              description={hasFilter ? 'Try changing or clearing your search.' : 'There are no records for this stat yet.'}
            />
          ) : (
            <ScrollableTable
              listMode
              minWidth={STAT_TABLE_WIDTH}
              header={
                <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.surfaceMuted, borderBottomColor: dividers.header }]}>
                  <HeaderCell label="TR/BP" width={STAT_COL_WIDTH.reference} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Customer" width={STAT_COL_WIDTH.name} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Address" width={STAT_COL_WIDTH.address} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Status" width={STAT_COL_WIDTH.status} color={colors.muted} />
                </View>
              }
            >
              <FlashList
                style={styles.flex}
                nestedScrollEnabled
                showsVerticalScrollIndicator
                data={filteredRows}
                keyExtractor={(row) => row.id}
                renderItem={({ item: row }) => <StatTableRow row={row} verticalDivider={dividers.vertical} />}
                contentContainerStyle={showPaginationFooter ? styles.listContentWithFooter : styles.listContent}
                onEndReachedThreshold={0.4}
                onEndReached={loadMore}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primaryDark}
                    colors={[colors.primaryDark]}
                    progressBackgroundColor={colors.card}
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
            onRetry={loadMore}
          />
        </View>
      </View>
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

function HeaderCell({ label, width, divider, color }: { label: string; width: number; divider?: string; color: string }) {
  return (
    <View style={[styles.cell, divider ? styles.cellDivider : null, { width, borderRightColor: divider }]}>
      <Text style={[styles.headerText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function StatTableRow({ row, verticalDivider }: { row: SupervisorStatDetailRow; verticalDivider: string }) {
  const { colors } = useTheme();
  const canOpen = Boolean(row.customerId);

  return (
    <Pressable
      disabled={!canOpen}
      onPress={() => {
        const customerId = row.customerId;
        if (!customerId) return;
        guardNavigation(() =>
          router.push({ pathname: '/customers/[id]', params: { id: customerId } }),
        );
      }}
      style={({ pressed }) => [
        styles.tableRow,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
        pressed && canOpen && { opacity: 0.72 },
      ]}
    >
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.reference, borderRightColor: verticalDivider }]}>
        <Text style={[styles.secondaryText, { color: colors.text }]} numberOfLines={1}>
          {row.reference || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.name, borderRightColor: verticalDivider }]}>
        <Text style={[styles.primaryText, { color: colors.text }]} numberOfLines={1}>
          {row.title || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.address, borderRightColor: verticalDivider }]}>
        <Text style={[styles.secondaryText, { color: colors.muted }]} numberOfLines={1}>
          {row.address || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, { width: STAT_COL_WIDTH.status }]}>
        <StatusPill status={row.status} />
      </View>
    </Pressable>
  );
}

function StatusPill({ status }: { status: SupervisorStatDetailRow['status'] }) {
  const { colors } = useTheme();
  const color =
    status === 'Done'
      ? colors.green
      : status === 'Sent Back'
        ? colors.red
        : status === 'In Progress'
          ? colors.blue
          : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: colors.softOrange }]}>
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expandedContent: {
    flex: 1,
    minWidth: 0,
  },
  tablePanel: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  resultText: {
    ...typography.caption,
  },
  tableCard: {
    flex: 1,
  },
  tableRow: {
    height: tableMetrics.rowHeight,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeader: {
    height: tableMetrics.headerHeight,
    borderBottomWidth: 1,
  },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: tableMetrics.cellPaddingH,
  },
  cellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  headerText: {
    ...tableText.header,
  },
  primaryText: {
    ...tableText.primary,
  },
  secondaryText: {
    ...tableText.secondary,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  listContentWithFooter: {
    paddingBottom: spacing.md + PAGINATION_OVERLAY_SPACE,
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
