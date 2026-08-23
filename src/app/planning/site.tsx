import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ChevronRight, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { guardNavigation } from "@/lib/navigation";
import { useDprRecordsQuery, useSiteCustomersQuery, useSitePlansQuery } from "@/queries";
import type { BackendDprRecord, BackendSitePlan, SiteCustomerRow } from "@/services/planning.service";
import { formatDate } from "@/utils/format";

type Mode = "work" | "dpr";

const ROW_HEIGHT = 46;

export default function SitePlanningScreen() {
  const { mode, siteId, siteName, date } = useLocalSearchParams<{
    mode: Mode;
    siteId: string;
    siteName?: string;
    date: string;
  }>();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const customersQuery = useSiteCustomersQuery(siteId, { enabled: Boolean(siteId) });
  const sitePlansQuery = useSitePlansQuery({ siteId, date }, { enabled: mode === "work" && Boolean(siteId && date) });
  const dprRecordsQuery = useDprRecordsQuery({ siteId, date }, { enabled: mode === "dpr" && Boolean(siteId && date) });

  const recordsQuery = mode === "work" ? sitePlansQuery : dprRecordsQuery;
  const isLoading = customersQuery.isLoading || recordsQuery.isLoading;
  const customers = customersQuery.data;

  const filteredCustomers = useMemo(() => {
    const allCustomers = customers ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return allCustomers;
    return allCustomers.filter(
      (customer) => customer.customerName.toLowerCase().includes(query) || customer.trBpNumber.toLowerCase().includes(query),
    );
  }, [customers, search]);

  const planByCustomer = new Map((sitePlansQuery.data ?? []).map((record) => [record.customerId, record]));
  const dprByCustomer = new Map((dprRecordsQuery.data ?? []).map((record) => [record.customerId, record]));

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([customersQuery.refetch(), recordsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const openCustomer = (customer: SiteCustomerRow) => {
    guardNavigation(() =>
      router.push({
        pathname: mode === "work" ? "/planning/plan" : "/planning/dpr",
        params: {
          customerId: customer.id,
          customerName: customer.customerName,
          trBpNumber: customer.trBpNumber,
          projectId: customer.projectId,
          siteId: customer.siteId,
          siteName: siteName ?? "",
          date,
        },
      }),
    );
  };

  const hasFilter = Boolean(search.trim());

  return (
    <Screen scroll={false} edges={["bottom"]} contentStyle={styles.screen} revealContent={false}>
      <AppHeader
        title={siteName || "Site"}
        subtitle={`${mode === "work" ? "Work Planning" : "DPR"} · ${formatDate(date)}`}
        left={<BackButton />}
      />

      <View style={styles.searchBlock}>
        <Input
          placeholder="Search customer or TR/BP..."
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.muted} />}
        />
      </View>

      {isLoading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <Skeleton key={key} height={ROW_HEIGHT} borderRadius={radius.sm} />
          ))}
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View style={styles.emptyFill}>
          <EmptyState
            fill
            title={hasFilter ? "No matching customers" : "No customers available for this site."}
            description={hasFilter ? "Try a different search." : undefined}
          />
        </View>
      ) : (
        <FlashList
          style={styles.flex}
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerRow
              customer={item}
              plan={planByCustomer.get(item.id)}
              dpr={dprByCustomer.get(item.id)}
              mode={mode}
              onPress={() => openCustomer(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primaryDark} colors={[colors.primaryDark]} progressBackgroundColor={colors.card} />
          }
          contentContainerStyle={styles.listContent}
        />
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

function CustomerRow({
  customer,
  plan,
  dpr,
  mode,
  onPress,
}: {
  customer: SiteCustomerRow;
  plan?: BackendSitePlan;
  dpr?: BackendDprRecord;
  mode: Mode;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const state =
    mode === "work"
      ? plan
        ? { label: "Planned", tone: colors.green }
        : { label: "Not Started", tone: colors.muted }
      : dpr
        ? dpr.status === "approved"
          ? { label: "Approved", tone: colors.green }
          : dpr.status === "submitted"
            ? { label: "Submitted", tone: colors.green }
            : { label: "Draft", tone: colors.amber }
        : { label: "Not Started", tone: colors.muted };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.78 }]}
    >
      <View style={styles.rowInfo}>
        <View style={styles.infoLine}>
          <Text style={[styles.infoLabel, { color: colors.muted }]}>Customer :</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
            {customer.customerName}
          </Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={[styles.infoLabel, { color: colors.muted }]}>TR/BP :</Text>
          <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
            {customer.trBpNumber || "-"}
          </Text>
        </View>
      </View>
      <View style={[styles.statusPill, { backgroundColor: `${state.tone}22` }]}>
        <Text style={[styles.statusText, { color: state.tone }]}>{state.label}</Text>
      </View>
      <ChevronRight size={16} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // See Screen.tsx's getChildFlexStyle - a real `style` prop with flex: 1
  // is what lets the empty state actually claim/center within the
  // remaining screen space, not just center within its own bounds.
  emptyFill: {
    flex: 1,
  },
  screen: {
    flex: 1,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  flex: {
    flex: 1,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBlock: {
    paddingBottom: spacing.xs,
  },
  skeletonList: {
    gap: spacing.xs,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  rowInfo: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  infoLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  infoLabel: {
    ...typography.caption,
    fontSize: 11,
  },
  infoValue: {
    ...typography.caption,
    fontSize: 12,
    fontFamily: typography.bodyMedium.fontFamily,
    flexShrink: 1,
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
