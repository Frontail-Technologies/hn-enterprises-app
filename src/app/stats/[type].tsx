import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Filter, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { statDetailStatusOptions } from '@/constants/stats';
import { tableDividers, tableMetrics, tableText } from '@/constants/table';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useStatDetailFilters } from '@/hooks/useStatDetailFilters';
import { useSupervisorStatDetails, useSupervisorStats } from '@/hooks/useMobileStats';
import { guardNavigation } from '@/lib/navigation';
import type { SupervisorStatDetailRow } from '@/services/mobileStats';

const EM_DASH = '—';

const STAT_COL_WIDTH = {
  name: 150,
  reference: 112,
  site: 150,
  status: 112,
  date: 106,
  helper: 190,
};

const STAT_TABLE_WIDTH = Object.values(STAT_COL_WIDTH).reduce((total, width) => total + width, 0);

export default function StatDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const [refreshing, setRefreshing] = useState(false);
  const { stats } = useSupervisorStats();
  const stat = stats.find((item) => item.id === type) ?? null;
  const { rows, total, isLoading, isFetchingNextPage, hasNextPage, loadMore, refetch } = useSupervisorStatDetails(
    type ? String(type) : undefined,
  );
  const {
    search,
    setSearch,
    filterOpen,
    setFilterOpen,
    statusFilter,
    setStatusFilter,
    siteFilter,
    setSiteFilter,
    siteSearch,
    setSiteSearch,
    visibleSiteOptions,
    filteredRows,
    resetFilters,
  } = useStatDetailFilters(rows);

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
      <AppHeader title={stat?.label ?? 'Stat Details'} subtitle={`${filteredRows.length} records`} left={<BackButton />} />

      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search records..."
        leftIcon={<Search size={18} color={colors.muted} />}
        rightIcon={<Filter size={18} color={colors.primary} />}
        onRightIconPress={() => setFilterOpen(true)}
      />

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          {isLoading ? 'Loading…' : `${filteredRows.length} of ${total} records`}
        </Text>
        <View style={styles.tableCard}>
          {isLoading ? (
            <TableSkeleton
              columnWidths={Object.values(STAT_COL_WIDTH)}
              rowHeight={tableMetrics.rowHeight}
              headerHeight={tableMetrics.headerHeight}
            />
          ) : (
            <ScrollableTable
              listMode
              minWidth={STAT_TABLE_WIDTH}
              header={
                <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.surfaceMuted, borderBottomColor: dividers.header }]}>
                  <HeaderCell label="Name / Work" width={STAT_COL_WIDTH.name} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Reference" width={STAT_COL_WIDTH.reference} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Site" width={STAT_COL_WIDTH.site} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Status" width={STAT_COL_WIDTH.status} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Date" width={STAT_COL_WIDTH.date} divider={dividers.vertical} color={colors.muted} />
                  <HeaderCell label="Detail" width={STAT_COL_WIDTH.helper} color={colors.muted} />
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
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primaryDark}
                    colors={[colors.primaryDark]}
                    progressBackgroundColor={colors.card}
                  />
                }
                ListFooterComponent={
                  hasNextPage ? (
                    <Pressable
                      onPress={loadMore}
                      disabled={isFetchingNextPage}
                      style={({ pressed }) => [styles.loadMoreRow, { borderColor: colors.border }, pressed && { opacity: 0.72 }]}
                    >
                      {isFetchingNextPage ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[typography.label, { color: colors.primary }]}>Load more</Text>
                      )}
                    </Pressable>
                  ) : null
                }
              />
            </ScrollableTable>
          )}
        </View>
      </View>

      <Sheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Records"
        footer={
          <View style={styles.footer}>
            <Button label="Reset" variant="outline" onPress={resetFilters} style={styles.footerButton} />
            <Button label="Apply" onPress={() => setFilterOpen(false)} style={styles.footerButton} />
          </View>
        }
      >
        <View style={styles.filterGroup}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Status</Text>
          {statDetailStatusOptions.map((status) => (
            <FilterOption
              key={status}
              label={status}
              active={statusFilter === status}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </View>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Site</Text>
          <Input
            placeholder="Search site..."
            value={siteSearch}
            onChangeText={setSiteSearch}
            leftIcon={<Search size={18} color={colors.muted} />}
          />
          {visibleSiteOptions.map((site) => (
            <FilterOption
              key={site}
              label={site}
              active={siteFilter === site}
              onPress={() => setSiteFilter(site)}
            />
          ))}
        </View>
      </Sheet>
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
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.name, borderRightColor: verticalDivider }]}>
        <Text style={[styles.primaryText, { color: colors.text }]} numberOfLines={1}>
          {row.title || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.reference, borderRightColor: verticalDivider }]}>
        <Text style={[styles.secondaryText, { color: colors.text }]} numberOfLines={1}>
          {row.reference || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.site, borderRightColor: verticalDivider }]}>
        <Text style={[styles.secondaryText, { color: colors.muted }]} numberOfLines={1}>
          {row.site || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.status, borderRightColor: verticalDivider }]}>
        <StatusPill status={row.status} />
      </View>
      <View style={[styles.cell, styles.cellDivider, { width: STAT_COL_WIDTH.date, borderRightColor: verticalDivider }]}>
        <Text style={[styles.secondaryText, { color: colors.text }]} numberOfLines={1}>
          {row.updatedOn || EM_DASH}
        </Text>
      </View>
      <View style={[styles.cell, { width: STAT_COL_WIDTH.helper }]}>
        <Text style={[styles.secondaryText, { color: colors.muted }]} numberOfLines={1}>
          {row.helper || EM_DASH}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: active ? colors.softOrange : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.78 },
      ]}
    >
      <Text style={[typography.body, { color: active ? colors.primary : colors.text }]}>{label}</Text>
      {active ? <Check size={17} color={colors.primary} /> : null}
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
  // No outer card chrome - header (surfaceMuted) and each row (surface) carry
  // their own fill, so the list blends into the page only in the gaps.
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
  loadMoreRow: {
    minHeight: 44,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
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
  filterGroup: {
    gap: spacing.sm,
  },
  filterTitle: {
    ...typography.label,
  },
  option: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
