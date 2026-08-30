import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Bell, UserRound } from "lucide-react-native";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { AttendanceSummarySection } from "@/components/home/AttendanceSummarySection";
import { OpenComplaintsSection } from "@/components/home/OpenComplaintsSection";
import { RecentActivitySection } from "@/components/home/RecentActivitySection";
import { StatsSection } from "@/components/home/StatsSection";
import { RevealGroup } from "@/components/ui/RevealGroup";
import { Screen } from "@/components/ui/Screen";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAttendanceStatus } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { guardNavigation } from "@/lib/navigation";
import { queryKeys, useComplaintsQuery } from "@/queries";
import { complaintsApi } from "@/services/complaints.service";

// Matches useComplaintsInfiniteQuery's own page size, so this prefetch
// populates the exact cache entry the Complaints screen will read.
const COMPLAINTS_PREFETCH_PAGE_SIZE = 100;

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const attendance = useAttendanceStatus();
  const { refetch: refetchComplaints } = useComplaintsQuery();
  const queryClient = useQueryClient();

  // Home surfaces attendance + stats + complaints + activity - each pulled
  // from its own source, so a pull-to-refresh here refetches exactly those
  // four instead of every active query in the app.
  const onRefresh = useCallback(async () => {
    await Promise.all([
      attendance.refetch(),
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.all }),
      refetchComplaints(),
    ]);
  }, [attendance, queryClient, refetchComplaints]);

  // Home always links into Complaints - warm its first page once on mount so
  // it's already cached by the time the user taps through.
  useEffect(() => {
    void queryClient.prefetchInfiniteQuery({
      queryKey: queryKeys.complaints.infiniteList({}),
      queryFn: ({ pageParam }) =>
        complaintsApi.listPage({ page: pageParam as number, limit: COMPLAINTS_PREFETCH_PAGE_SIZE }),
      initialPageParam: 1,
    });
  }, [queryClient]);

  return (
    <Screen scroll tabBarAware edges={["bottom"]} contentStyle={styles.screen} onRefresh={onRefresh} revealContent={false}>
      <AppHeader
        title={user?.name ?? "Supervisor"}
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => guardNavigation(() => router.push("/notifications"))}
              style={styles.notificationWrap}
            >
              <Bell size={23} color="#FFFFFF" />
              {unreadCount ? (
                <View style={[styles.badgeDot, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => guardNavigation(() => router.push("/profile"))}
              style={[styles.profileAction, { borderColor: "rgba(255,255,255,0.28)" }]}
            >
              <UserRound size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        }
      />

      <View style={styles.content}>
        <RevealGroup>
          <AttendanceSummarySection />
          <StatsSection />
          <OpenComplaintsSection />
          <RecentActivitySection />
        </RevealGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 104,
  },
  notificationWrap: {
    position: "relative",
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  profileAction: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 17,
  },
  badgeDot: {
    position: "absolute",
    top: -2,
    right: 0,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 12,
    fontFamily: typography.label.fontFamily,
  },
  content: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
});
