import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ComplaintBoxSkeleton } from '@/components/shared/ComplaintBoxSkeleton';
import { ComplaintListItem } from '@/components/shared/ComplaintListItem';
import { FilterChip } from '@/components/shared/FilterChip';
import { ComplaintUpdateSheet } from '@/components/complaints/ComplaintUpdateSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { complaintStatusFilters, complaintStatusLabels } from '@/constants/complaints';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeContext';
import { useComplaintsScreen } from '@/hooks/useComplaintsScreen';

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const {
    isLoading,
    complaints,
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

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={styles.screen} revealContent={false}>
      <AppHeader
        title="Complaints"
        subtitle={`${filteredComplaints.length} of ${complaints.length} records`}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <FlashList
        style={styles.flex}
        data={filteredComplaints}
        keyExtractor={(complaint) => complaint.id}
        renderItem={({ item: complaint }) => (
          <ComplaintListItem complaint={complaint} onPress={() => setActiveComplaint(complaint)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
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
            <Input
              placeholder="Search complaint or customer..."
              value={search}
              onChangeText={setSearch}
              leftIcon={<Search size={18} color={colors.muted} />}
            />

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

            {isLoading ? <ComplaintBoxSkeleton /> : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title={hasFilter ? 'No matching complaints' : 'No complaints yet'}
              description={hasFilter ? 'Try changing or clearing your filters.' : 'There are no complaints to show.'}
            />
          )
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
  headerBlock: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});
