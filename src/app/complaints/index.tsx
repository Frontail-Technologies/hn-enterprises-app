import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ComplaintBoxSkeleton } from '@/components/shared/ComplaintBoxSkeleton';
import { ComplaintListItem } from '@/components/shared/ComplaintListItem';
import { FilterChip } from '@/components/shared/FilterChip';
import { ComplaintUpdateSheet } from '@/components/complaints/ComplaintUpdateSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { complaintStatusFilters, complaintStatusLabels } from '@/constants/complaints';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useComplaintsScreen } from '@/hooks/useComplaintsScreen';
import { formatCount } from '@/utils/format';

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const authGuard = useAuthGuard();
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const {
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
    total,
    filteredComplaints,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeComplaint,
    setActiveComplaint,
    refetch,
  } = useComplaintsScreen();

  const hasFilter = search.trim().length > 0 || statusFilter !== 'All';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // No _layout.tsx covers this route - it guards itself via the same
  // centralized check ProtectedStack uses for grouped routes.
  if (authGuard.blocked) return authGuard.element;

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={styles.screen} revealContent={false}>
      <AppHeader
        title="Complaints"
        subtitle={formatCount(filteredComplaints.length, total, 'records')}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
        actions={
          searchOpen || filterOpen
            ? undefined
            : [
                {
                  key: 'search',
                  icon: Search,
                  accessibilityLabel: 'Search complaints',
                  onPress: () => {
                    setFilterOpen(false);
                    setSearchOpen(true);
                  },
                },
                {
                  key: 'filter',
                  icon: SlidersHorizontal,
                  accessibilityLabel: 'Filter complaints',
                  // Reflects a status filter that arrived via Home's deep link
                  // just as much as one set here - statusFilter's initial
                  // value already comes from the route param (see
                  // useComplaintsScreen), so this is accurate either way.
                  active: statusFilter !== 'All',
                  onPress: () => {
                    setSearchOpen(false);
                    setFilterOpen(true);
                  },
                },
              ]
        }
        bottomContent={
          searchOpen ? (
            <View style={styles.expandedRow}>
              <View style={styles.expandedInput}>
                <Input
                  autoFocus
                  placeholder="Search complaint or customer..."
                  value={search}
                  onChangeText={setSearch}
                  leftIcon={<Search size={18} color={colors.muted} />}
                />
              </View>
              <Pressable
                onPress={() => {
                  setSearch('');
                  setSearchOpen(false);
                }}
                style={styles.headerAction}
              >
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : filterOpen ? (
            <View style={styles.expandedRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {complaintStatusFilters.map((item) => (
                  <FilterChip
                    key={item}
                    label={item === 'All' ? 'All' : complaintStatusLabels[item]}
                    active={statusFilter === item}
                    onPress={() => setStatusFilter(item)}
                  />
                ))}
              </ScrollView>
              <Pressable onPress={() => setFilterOpen(false)} style={styles.headerAction}>
                <X size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : undefined
        }
      />

      <FlashList
        style={styles.flex}
        data={filteredComplaints}
        keyExtractor={(complaint) => complaint.id}
        renderItem={({ item: complaint }) => <ComplaintListItem complaint={complaint} onPress={setActiveComplaint} />}
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
        ListHeaderComponent={isLoading ? <View style={styles.headerBlock}><ComplaintBoxSkeleton /></View> : null}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              fill
              title={hasFilter ? 'No matching complaints' : 'No complaints yet'}
              description={hasFilter ? 'Try changing or clearing your filters.' : 'There are no complaints to show.'}
            />
          )
        }
        ListFooterComponent={
          !isLoading && filteredComplaints.length > 0 ? (
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

      <ComplaintUpdateSheet complaint={activeComplaint} onClose={() => setActiveComplaint(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
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
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  expandedInput: {
    flex: 1,
    minWidth: 0,
  },
  headerBlock: {
    paddingBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // flexGrow (not flex) so the content area can grow to fill the viewport
  // when it's shorter than that (the empty state) - what EmptyState's own
  // `fill` (flex: 1) needs to have space to center within. No-op once real
  // rows exceed the viewport height.
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  loadMoreRow: {
    minHeight: 44,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
});
