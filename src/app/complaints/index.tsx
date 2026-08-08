import { useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ComplaintBoxSkeleton } from '@/components/shared/ComplaintBoxSkeleton';
import { ComplaintListItem } from '@/components/shared/ComplaintListItem';
import { FilterChip } from '@/components/shared/FilterChip';
import { ComplaintUpdateSheet } from '@/components/complaints/ComplaintUpdateSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { complaintStatusFilters, complaintStatusLabels } from '@/constants/complaints';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeContext';
import { useComplaintsScreen } from '@/hooks/useComplaintsScreen';

export default function ComplaintsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
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
  } = useComplaintsScreen();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={styles.screen}>
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
          <Reveal stagger={false}>
            <ComplaintListItem complaint={complaint} onPress={() => setActiveComplaint(complaint)} />
          </Reveal>
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

            <View style={styles.chips}>
              {complaintStatusFilters.map((item) => (
                <FilterChip
                  key={item}
                  label={item === 'All' ? 'All' : complaintStatusLabels[item]}
                  active={statusFilter === item}
                  onPress={() => setStatusFilter(item)}
                />
              ))}
            </View>

            {isLoading ? <ComplaintBoxSkeleton /> : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : <EmptyState title="No complaints found" description="Try changing the filters or check back later." />
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
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});
