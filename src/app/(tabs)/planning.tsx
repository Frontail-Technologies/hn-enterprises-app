import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ChevronRight, ClipboardList, FileText, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { FilterChip } from "@/components/shared/FilterChip";
import { PlanningDateNav } from "@/components/shared/PlanningDateNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { guardNavigation } from "@/lib/navigation";
import { useDprOverviewQuery, useWorkPlanningOverviewQuery } from "@/queries";
import type { SiteOverviewRow } from "@/services/planning.service";
import { toDateKey } from "@/utils/date";
import { formatCount } from "@/utils/format";

type Mode = "work" | "dpr";

export default function PlanningOverviewScreen() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("work");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const workQuery = useWorkPlanningOverviewQuery(date);
  const dprQuery = useDprOverviewQuery(date);
  const activeQuery = mode === "work" ? workQuery : dprQuery;
  const rows = activeQuery.data;
  const isLoading = activeQuery.isLoading;

  const filteredRows = useMemo(() => {
    const allRows = rows ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return allRows;
    return allRows.filter(
      (row) => row.siteName.toLowerCase().includes(query) || row.projectName.toLowerCase().includes(query),
    );
  }, [rows, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await activeQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const openSite = (site: SiteOverviewRow) => {
    guardNavigation(() =>
      router.push({
        pathname: "/planning/site",
        params: { mode, siteId: site.siteId, siteName: site.siteName, date },
      }),
    );
  };

  const hasFilter = Boolean(search.trim());

  return (
    <Screen scroll={false} edges={["bottom"]} contentStyle={styles.screen} revealContent={false}>
      <AppHeader title="DPR / Planning" subtitle={formatCount(filteredRows.length, rows?.length ?? 0, "sites")} />

      <View style={styles.headerBlock}>
        <PlanningDateNav date={date} onChange={setDate} />

        <View style={styles.modeRow}>
          <FilterChip label="Work Planning" active={mode === "work"} onPress={() => setMode("work")} />
          <FilterChip label="DPR" active={mode === "dpr"} onPress={() => setMode("dpr")} />
        </View>

        <Input
          placeholder="Search site or project..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.muted} />}
        />
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} height={56} borderRadius={radius.sm} />
          ))}
        </View>
      ) : filteredRows.length === 0 ? (
        <EmptyState
          title={hasFilter ? "No matching sites" : "No sites/customers available for this date."}
          description={hasFilter ? "Try a different search." : undefined}
          icon={mode === "work" ? <ClipboardList size={22} color={colors.primary} /> : <FileText size={22} color={colors.primary} />}
        />
      ) : (
        <FlashList
          style={styles.flex}
          data={filteredRows}
          keyExtractor={(item) => item.siteId}
          renderItem={({ item }) => <SiteRow row={item} onPress={() => openSite(item)} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primaryDark} colors={[colors.primaryDark]} progressBackgroundColor={colors.card} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </Screen>
  );
}

function SiteRow({ row, onPress }: { row: SiteOverviewRow; onPress: () => void }) {
  const { colors } = useTheme();
  const tone = row.status === "done" ? colors.green : row.status === "partial" ? colors.amber : colors.muted;
  const label = row.status === "done" ? "Done" : row.status === "partial" ? "Partial" : "Pending";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.78 }]}
    >
      <View style={styles.rowInfo}>
        <Text style={[styles.siteName, { color: colors.text }]} numberOfLines={1}>
          {row.siteName}
        </Text>
        <Text style={[styles.projectName, { color: colors.muted }]} numberOfLines={1}>
          {row.projectName}
        </Text>
      </View>
      <View style={styles.rowStatus}>
        <Text style={[styles.countText, { color: colors.text }]}>
          {row.completedCustomers}/{row.totalCustomers}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: `${tone}22` }]}>
          <Text style={[styles.statusText, { color: tone }]}>{label}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  headerBlock: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  siteName: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  projectName: {
    ...typography.caption,
    fontSize: 12,
  },
  rowStatus: {
    alignItems: "flex-end",
    gap: 4,
  },
  countText: {
    ...typography.caption,
    fontSize: 12,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
  },
});
