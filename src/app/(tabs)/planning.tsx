import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Calendar, ChevronLeft, ChevronRight, ClipboardList, FileText, Search, X } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import PagerView from "react-native-pager-view";

import { AppHeader } from "@/components/shared/AppHeader";
import { PlanningDateNav } from "@/components/shared/PlanningDateNav";
import { SectionTabBar } from "@/components/shared/SectionTabBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { StickyHeaderGroup } from "@/components/ui/StickyHeaderGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useSwipeableTabs } from "@/hooks/useSwipeableTabs";
import { guardNavigation } from "@/lib/navigation";
import { useDprOverviewQuery, useWorkPlanningOverviewQuery } from "@/queries";
import type { SiteOverviewRow } from "@/services/planning.service";
import { toDateKey } from "@/utils/date";
import { formatCount } from "@/utils/format";

type Mode = "work" | "dpr";

const MODE_TABS = [
  { key: "work", label: "Work Planning", icon: ClipboardList },
  { key: "dpr", label: "DPR", icon: FileText },
];

const MODE_KEYS = MODE_TABS.map((tab) => tab.key);

function filterSites(rows: SiteOverviewRow[] | undefined, search: string) {
  const allRows = rows ?? [];
  const query = search.trim().toLowerCase();
  if (!query) return allRows;
  return allRows.filter(
    (row) => row.siteName.toLowerCase().includes(query) || row.projectName.toLowerCase().includes(query),
  );
}

export default function PlanningOverviewScreen() {
  const { colors } = useTheme();
  const {
    activeKey: activeTab,
    pagerRef,
    initialIndex,
    onPageSelected,
    isMounted,
    selectTab: setActiveTab,
  } = useSwipeableTabs(MODE_KEYS);
  const mode = activeTab as Mode;
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [search, setSearch] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const workQuery = useWorkPlanningOverviewQuery(date);
  const dprQuery = useDprOverviewQuery(date);

  const filteredWorkRows = useMemo(() => filterSites(workQuery.data, search), [workQuery.data, search]);
  const filteredDprRows = useMemo(() => filterSites(dprQuery.data, search), [dprQuery.data, search]);
  const activeRowCount = mode === "work" ? filteredWorkRows.length : filteredDprRows.length;
  const activeTotalCount = mode === "work" ? (workQuery.data?.length ?? 0) : (dprQuery.data?.length ?? 0);

  const openSite = useCallback(
    (site: SiteOverviewRow, siteMode: Mode) => {
      guardNavigation(() =>
        router.push({
          pathname: "/planning/site",
          params: { mode: siteMode, siteId: site.siteId, siteName: site.siteName, date },
        }),
      );
    },
    [date],
  );

  const hasFilter = Boolean(search.trim());

  return (
    <Screen scroll={false} tabBarAware edges={["bottom"]} contentStyle={styles.screen} revealContent={false}>
      <StickyHeaderGroup>
        <AppHeader
          title="DPR / Planning"
          subtitle={formatCount(activeRowCount, activeTotalCount, "sites")}
          actions={
            dateOpen || searchOpen
              ? undefined
              : [
                  {
                    key: "date",
                    icon: Calendar,
                    accessibilityLabel: "Change date",
                    onPress: () => setDateOpen(true),
                  },
                  {
                    key: "search",
                    icon: Search,
                    accessibilityLabel: "Search sites",
                    active: Boolean(search.trim()),
                    onPress: () => setSearchOpen(true),
                  },
                ]
          }
          bottomContent={
            dateOpen ? (
              <View style={styles.expandedRow}>
                <View style={styles.expandedContent}>
                  <PlanningDateNav date={date} onChange={setDate} />
                </View>
                <Pressable onPress={() => setDateOpen(false)} style={styles.headerAction}>
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : searchOpen ? (
              <View style={styles.expandedRow}>
                {/* Collapses without clearing - the query stays applied in
                    the background; clearing is the Input's own rightIcon. */}
                <Pressable onPress={() => setSearchOpen(false)} style={styles.headerAction}>
                  <ChevronLeft size={20} color="#FFFFFF" />
                </Pressable>
                <View style={styles.expandedContent}>
                  <Input
                    autoFocus
                    placeholder="Search site or project..."
                    value={search}
                    onChangeText={setSearch}
                    leftIcon={<Search size={18} color={colors.muted} />}
                    rightIcon={search ? <X size={16} color={colors.muted} /> : undefined}
                    onRightIconPress={() => setSearch("")}
                  />
                </View>
              </View>
            ) : undefined
          }
        />

        <SectionTabBar
          tabs={MODE_TABS}
          activeKey={mode}
          onChange={setActiveTab}
          fullWidth
          surface
        />
      </StickyHeaderGroup>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
      >
        <View key="work" style={styles.page}>
          {isMounted("work") ? (
            <PlanningSiteList
              mode="work"
              isLoading={workQuery.isLoading}
              rows={filteredWorkRows}
              hasFilter={hasFilter}
              onPressSite={(site) => openSite(site, "work")}
              refreshing={workQuery.isRefetching}
              onRefresh={workQuery.refetch}
            />
          ) : null}
        </View>

        <View key="dpr" style={styles.page}>
          {isMounted("dpr") ? (
            <PlanningSiteList
              mode="dpr"
              isLoading={dprQuery.isLoading}
              rows={filteredDprRows}
              hasFilter={hasFilter}
              onPressSite={(site) => openSite(site, "dpr")}
              refreshing={dprQuery.isRefetching}
              onRefresh={dprQuery.refetch}
            />
          ) : null}
        </View>
      </PagerView>
    </Screen>
  );
}

function PlanningSiteList({
  mode,
  isLoading,
  rows,
  hasFilter,
  onPressSite,
  refreshing,
  onRefresh,
}: {
  mode: Mode;
  isLoading: boolean;
  rows: SiteOverviewRow[];
  hasFilter: boolean;
  onPressSite: (site: SiteOverviewRow) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.skeletonList}>
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} height={56} borderRadius={radius.sm} />
        ))}
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={styles.emptyFill}>
        <EmptyState
          fill
          title={hasFilter ? "No matching sites" : "No sites/customers available for this date."}
          description={hasFilter ? "Try a different search." : undefined}
          icon={mode === "work" ? <ClipboardList size={22} color={colors.primary} /> : <FileText size={22} color={colors.primary} />}
        />
      </View>
    );
  }

  return (
    <FlashList
      style={styles.flex}
      data={rows}
      keyExtractor={(item) => item.siteId}
      renderItem={({ item }) => <SiteRow row={item} onPress={() => onPressSite(item)} />}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primaryDark} colors={[colors.primaryDark]} progressBackgroundColor={colors.card} />
      }
      contentContainerStyle={styles.listContent}
    />
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
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  emptyFill: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  expandedContent: {
    flex: 1,
    minWidth: 0,
  },
  skeletonList: {
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.md,
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
