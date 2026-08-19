import { router } from 'expo-router';
import { ClipboardCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatSummaryCard } from '@/components/shared/StatSummaryCard';
import { StatsGridSkeleton } from '@/components/shared/StatsGridSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { spacing } from '@/constants/spacing';
import { statIcons } from '@/constants/statIcons';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { guardNavigation } from '@/lib/navigation';
import { useSupervisorStatsQuery } from '@/queries';

const SUMMARY_CARD_LIMIT = 6;

export function StatsSection() {
  const { colors } = useTheme();
  const { isTablet, isLargeTablet } = useResponsive();
  const statCardWidth = isLargeTablet ? '15.3%' : isTablet ? '23.6%' : '31.6%';
  const { data: stats = [], isLoading, isError, refetch } = useSupervisorStatsQuery();
  const summaryCards = stats.slice(0, SUMMARY_CARD_LIMIT).map((stat) => ({
    ...stat,
    icon: statIcons[stat.id] ?? ClipboardCheck,
  }));

  return (
    <View style={styles.quickSection}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Stats</Text>
        <Pressable onPress={() => guardNavigation(() => router.push('/stats'))}>
          <Text style={[typography.label, { color: colors.primary }]}>View more</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <StatsGridSkeleton />
      ) : isError ? (
        <ErrorState compact title="Couldn't load stats" description="Check your connection and try again." onRetry={refetch} />
      ) : (
        <View style={styles.statsGrid}>
          {summaryCards.map((item) => (
            <StatSummaryCard key={item.label} {...item} widthPercent={statCardWidth} />
          ))}
        </View>
      )}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
