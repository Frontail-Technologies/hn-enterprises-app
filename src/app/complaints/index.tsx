import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
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

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader
        title="Complaints"
        subtitle={`${filteredComplaints.length} of ${complaints.length} records`}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

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

      {filteredComplaints.length ? (
        <View style={styles.list}>
          {filteredComplaints.map((complaint) => (
            <ComplaintListItem
              key={complaint.id}
              complaint={complaint}
              onPress={() => setActiveComplaint(complaint)}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          title={isLoading ? 'Loading complaints...' : 'No complaints found'}
          description={isLoading ? undefined : 'Try changing the filters or check back later.'}
        />
      )}

      <ComplaintUpdateSheet complaint={activeComplaint} onClose={() => setActiveComplaint(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});
