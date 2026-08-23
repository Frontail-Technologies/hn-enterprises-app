import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ComplaintBoxSkeleton as ListRowSkeleton } from '@/components/shared/ComplaintBoxSkeleton';
import { FilterChip } from '@/components/shared/FilterChip';
import { WorkProgressCard } from '@/components/shared/WorkProgressCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { workQueueStatusFilters } from '@/constants/workProgress';
import { useTheme } from '@/context/ThemeContext';
import { useWorkQueueFilters } from '@/hooks/useWorkQueueFilters';
import { formatCount } from '@/utils/format';

export default function WorkQueueScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    projectFilter,
    setProjectFilter,
    siteFilter,
    setSiteFilter,
    stageFilter,
    setStageFilter,
    projectOptions,
    siteOptions,
    stageOptions,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    refetch,
    total,
    records,
    inProgressCount,
    sentBackCount,
    pendingEvidenceCount,
  } = useWorkQueueFilters();

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
        title="Work Queue"
        subtitle={formatCount(records.length, total, 'work-progress records')}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <FlashList
        style={styles.flex}
        data={records}
        keyExtractor={(record) => record.id}
        renderItem={({ item: record }) => (
          <WorkProgressCard record={record} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
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
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.summaryGrid}>
              <SummaryTile label="In Progress" value={String(inProgressCount)} color={colors.accent} />
              <SummaryTile label="Sent Back" value={String(sentBackCount)} color={colors.primary} />
              <SummaryTile label="Evidence" value={String(pendingEvidenceCount)} color={colors.green} />
            </View>

            <Input
              placeholder="Search customer, BP/TR, stage or site"
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={18} color={colors.muted} />}
            />

            <View style={styles.chips}>
              {workQueueStatusFilters.map((item) => (
                <FilterChip key={item} label={item} active={statusFilter === item} onPress={() => setStatusFilter(item)} />
              ))}
            </View>

            <FilterRow label="Project" options={projectOptions} value={projectFilter} onChange={setProjectFilter} />
            <FilterRow label="Site" options={siteOptions} value={siteFilter} onChange={setSiteFilter} />
            <FilterRow label="Stage" options={stageOptions} value={stageFilter} onChange={setStageFilter} />

            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Progress</Text>
              <Text style={[typography.label, { color: colors.muted }]}>{formatCount(records.length, total, 'records')}</Text>
            </View>

            {isLoading ? <ListRowSkeleton /> : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : isError ? (
            <ErrorState fill title="Couldn't load the work queue" description="Check your connection and try again." onRetry={refetch} />
          ) : (
            <EmptyState fill title="No work-progress records" description="Try changing the filters or check back after a survey is assigned." />
          )
        }
        ListFooterComponent={
          !isLoading && records.length > 0 ? (
            isFetchingNextPage ? (
              <View style={styles.loadMoreRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : isError && hasNextPage ? (
              <Pressable
                onPress={loadMore}
                style={({ pressed }) => [
                  styles.loadMoreRow,
                  { borderWidth: 1, borderColor: colors.border },
                  pressed && { opacity: 0.72 },
                ]}
              >
                <Text style={[typography.label, { color: colors.primary }]}>Retry</Text>
              </Pressable>
            ) : null
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.filterBlock}>
      <Text style={[typography.label, { color: colors.muted }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            active={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();

  return (
    <Card style={styles.summaryTile}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 104,
  },
  flex: {
    flex: 1,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryTile: {
    flex: 1,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  summaryValue: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    lineHeight: 27,
  },
  summaryLabel: {
    ...typography.label,
    textAlign: 'center',
    fontSize: 11,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterBlock: {
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadMoreRow: {
    minHeight: 44,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});
