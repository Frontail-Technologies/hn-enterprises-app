import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowLeft, ClipboardCheck } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { StatSummaryCard } from "@/components/shared/StatSummaryCard";
import { StatsGridSkeleton } from "@/components/shared/StatsGridSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { spacing } from "@/constants/spacing";
import { statIcons } from "@/constants/statIcons";
import { useSupervisorStats } from "@/hooks/useMobileStats";
import { useResponsive } from "@/hooks/useResponsive";
import { queryKeys } from "@/queries";

export default function AllStatsScreen() {
  const { stats, isLoading } = useSupervisorStats();
  const { isTablet, isLargeTablet } = useResponsive();
  const statCardWidth = isLargeTablet ? "15.3%" : isTablet ? "23.6%" : "31.6%";
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary });
  }, [queryClient]);

  return (
    <Screen scroll edges={["bottom"]} contentStyle={styles.screen} onRefresh={onRefresh}>
      <AppHeader
        title="All Stats"
        subtitle="Supervisor work progress summary"
        left={<BackButton />}
      />
      {isLoading ? (
        <StatsGridSkeleton />
      ) : !stats.length ? (
        <EmptyState title="No stats available" />
      ) : (
        <View style={styles.grid}>
          {stats.map((stat) => (
            <StatSummaryCard
              key={stat.id}
              {...stat}
              icon={statIcons[stat.id] ?? ClipboardCheck}
              widthPercent={statCardWidth}
            />
          ))}
        </View>
      )}
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

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
});
