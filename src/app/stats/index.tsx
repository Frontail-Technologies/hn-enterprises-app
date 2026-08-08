import { router } from "expo-router";
import { ArrowLeft, ClipboardCheck } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { StatSummaryCard } from "@/components/shared/StatSummaryCard";
import { StatsGridSkeleton } from "@/components/shared/StatsGridSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Screen } from "@/components/ui/Screen";
import { spacing } from "@/constants/spacing";
import { statIcons } from "@/constants/statIcons";
import { useSupervisorStats } from "@/hooks/useMobileStats";

export default function AllStatsScreen() {
  const { stats, isLoading } = useSupervisorStats();

  return (
    <Screen scroll edges={["bottom"]} contentStyle={styles.screen}>
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
