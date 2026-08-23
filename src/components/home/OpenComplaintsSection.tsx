import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ComplaintUpdateSheet } from '@/components/complaints/ComplaintUpdateSheet';
import { ComplaintBoxSkeleton } from '@/components/shared/ComplaintBoxSkeleton';
import { ComplaintListItem } from '@/components/shared/ComplaintListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import { useComplaintsQuery } from '@/queries';
import { isOpenComplaint, type ComplaintRecord } from '@/services/complaints.service';

const OPEN_COMPLAINTS_LIMIT = 3;

// Owns its own complaint-detail sheet, since tapping a row here is entirely
// self-contained and doesn't need to bubble up to Home.
export function OpenComplaintsSection() {
  const { colors } = useTheme();
  const [activeComplaint, setActiveComplaint] = useState<ComplaintRecord | null>(null);
  const { data: complaints = [], isLoading, isError, refetch } = useComplaintsQuery();
  const openComplaints = complaints.filter(isOpenComplaint).slice(0, OPEN_COMPLAINTS_LIMIT);

  return (
    <View style={styles.quickSection}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Complaints</Text>
        <Pressable onPress={() => guardNavigation(() => router.push('/complaints'))}>
          <Text style={[typography.label, { color: colors.primary }]}>View all</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <ComplaintBoxSkeleton />
      ) : isError ? (
        <ErrorState
          compact
          title="Couldn't load complaints"
          description="Check your connection and try again."
          onRetry={refetch}
        />
      ) : openComplaints.length ? (
        <View style={styles.list}>
          {openComplaints.map((complaint) => (
            <ComplaintListItem key={complaint.id} complaint={complaint} onPress={setActiveComplaint} />
          ))}
        </View>
      ) : (
        <EmptyState compact title="No open complaints" />
      )}

      <ComplaintUpdateSheet complaint={activeComplaint} onClose={() => setActiveComplaint(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  quickSection: {
    gap: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  list: {
    gap: spacing.sm,
  },
});
