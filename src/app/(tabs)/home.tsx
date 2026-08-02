import { router } from "expo-router";
import {
  Bell,
  ClipboardCheck,
  LockKeyhole,
  UserRound,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActivityListItem } from "@/components/shared/ActivityListItem";
import { AppHeader } from "@/components/shared/AppHeader";
import { AttendanceReminderSheet } from "@/components/shared/AttendanceReminderSheet";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { radius, spacing } from "@/constants/spacing";
import { statIcons } from "@/constants/statIcons";
import { typography } from "@/constants/typography";
import { useAttendanceStatus } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useRecentActivity } from "@/hooks/useRecentActivity";
import type { ActivityLogEntry } from "@/services/mockData";
import {
  getSupervisorStats,
  type SupervisorStatTone,
} from "@/services/mobileStats";
import { toDateKey } from "@/utils/date";
import { formatTime } from "@/utils/format";

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const attendance = useAttendanceStatus();
  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    if (attendance.loading || attendance.isCheckedInToday) return;

    const timer = setTimeout(() => setReminderVisible(true), 500);
    return () => clearTimeout(timer);
  }, [attendance.isCheckedInToday, attendance.loading]);

  const attendanceActivity = useMemo<ActivityLogEntry[]>(() => {
    const activity: ActivityLogEntry[] = [];

    if (attendance.checkInAt) {
      activity.push({
        id: "activity-attendance-check-in",
        title: "Checked In",
        description:
          attendance.checkInLocation?.address ??
          "Today check-in captured with location.",
        category: "Attendance",
        timestamp: attendance.checkInAt,
        route: { pathname: "/attendance" },
      });
    }

    if (attendance.checkOutAt) {
      activity.push({
        id: "activity-attendance-check-out",
        title: "Checked Out",
        description:
          attendance.checkOutLocation?.address ??
          "Today checkout captured with location.",
        category: "Attendance",
        timestamp: attendance.checkOutAt,
        route: { pathname: "/attendance" },
      });
    }

    return activity;
  }, [
    attendance.checkInAt,
    attendance.checkInLocation?.address,
    attendance.checkOutAt,
    attendance.checkOutLocation?.address,
  ]);

  const attendanceStatusLabel = attendance.isCheckedOutToday
    ? "Checked Out"
    : attendance.isCheckedInToday
      ? "Checked In"
      : "Not Checked In";
  const attendanceStatusHelper = attendance.isCheckedOutToday
    ? `Out ${formatTime(attendance.checkOutAt)} Today`
    : attendance.isCheckedInToday
      ? `In ${formatTime(attendance.checkInAt)} Today`
      : "Location required";

  const attendanceStatusColor = attendance.isCheckedInToday
    ? colors.green
    : colors.primary;

  const { items: recentActivity } = useRecentActivity({
    extra: attendanceActivity,
    limit: 4,
    supervisorId: user?.id,
  });

  const summaryCards = getSupervisorStats()
    .slice(0, 6)
    .map((stat) => ({
      ...stat,
      icon: statIcons[stat.id] ?? ClipboardCheck,
    }));

  return (
    <Screen scroll tabBarAware edges={["bottom"]} contentStyle={styles.screen}>
      <AppHeader
        title={user?.name ?? "Supervisor"}
        subtitle="Good Morning, here's your operational overview"
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/notifications")}
              style={styles.notificationWrap}
            >
              <Bell size={23} color="#FFFFFF" />
              {unreadCount ? (
                <View
                  style={[styles.badgeDot, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push("/profile")}
              style={[
                styles.profileAction,
                { borderColor: "rgba(255,255,255,0.28)" },
              ]}
            >
              <UserRound size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        }
      />

      <View style={styles.content}>
        <Card style={styles.attendanceCard}>
          <View
            style={[
              styles.lockCircle,
              {
                borderColor: attendanceStatusColor,
              },
            ]}
          >
            <LockKeyhole size={23} color={attendanceStatusColor} />
          </View>
          <View style={styles.attendanceText}>
            <Text style={[typography.label, { color: colors.muted }]}>
              Attendance
            </Text>
            <Text
              style={[
                styles.checkedIn,
                {
                  color: attendanceStatusColor,
                },
              ]}
            >
              {attendanceStatusLabel}
            </Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              {attendanceStatusHelper}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (attendance.isCheckedInToday) {
                const today = new Date();
                router.push({
                  pathname: "/attendance/[day]",
                  params: {
                    day: String(today.getDate()),
                    date: toDateKey(today),
                    status: "Present",
                  },
                });
                return;
              }

              router.push("/attendance");
            }}
            style={[styles.detailsButton, { borderColor: colors.border }]}
          >
            <Text style={[typography.label, { color: colors.text }]}>
              View Details
            </Text>
          </Pressable>
        </Card>

        <View style={styles.quickSection}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Work Stats
            </Text>
            <Pressable onPress={() => router.push("/stats/index")}>
              <Text style={[typography.label, { color: colors.primary }]}>
                View more
              </Text>
            </Pressable>
          </View>
          <View style={styles.statsGrid}>
            {summaryCards.map((item) => (
              <SummaryCard key={item.label} {...item} />
            ))}
          </View>
        </View>

        <View style={styles.quickSection}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            <Pressable onPress={() => router.push("/activity")}>
              <Text style={[typography.label, { color: colors.primary }]}>
                View all
              </Text>
            </Pressable>
          </View>
          <View style={styles.activityList}>
            {recentActivity.map((item) => (
              <ActivityListItem key={item.id} item={item} />
            ))}
          </View>
        </View>
      </View>

      <AttendanceReminderSheet
        visible={reminderVisible}
        onClose={() => setReminderVisible(false)}
      />
    </Screen>
  );
}

type SummaryCardProps = {
  id: string;
  label: string;
  value: string;
  icon: typeof ClipboardCheck;
  tone: SupervisorStatTone;
};

function SummaryCard({
  id,
  label,
  value,
  icon: Icon,
  tone,
}: SummaryCardProps) {
  const { colors } = useTheme();
  const accentColor =
    tone === "red"
      ? colors.red
      : tone === "green"
        ? colors.green
        : tone === "orange"
          ? colors.primary
          : colors.blue;
  const softColor =
    tone === "orange"
      ? colors.softOrange
      : tone === "red"
        ? "#FEE2E2"
        : tone === "green"
          ? "#DCFCE7"
          : colors.softBlue;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/stats/[type]", params: { type: id } })
      }
      style={({ pressed }) => [
        styles.statPressable,
        pressed && { opacity: 0.72 },
      ]}
      >
        <Card style={styles.statCard}>
          <Text
            style={[typography.label, styles.statLabel, { color: colors.text }]}
            numberOfLines={2}
          >
            {label}
          </Text>
          <View style={styles.statBottom}>
            <Text style={[styles.statValue, { color: accentColor }]}>{value}</Text>
            <View style={[styles.statIcon, { backgroundColor: softColor }]}>
              <Icon size={18} color={accentColor} />
            </View>
          </View>
        </Card>
      </Pressable>
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
  attendanceCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  lockCircle: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderRadius: 27,
  },
  attendanceText: {
    flex: 1,
    gap: 1,
  },
  checkedIn: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  detailsButton: {
    minHeight: 38,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statCard: {
    width: "100%",
    minHeight: 106,
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  statPressable: {
    width: "31.6%",
  },
  statBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 14,
  },
  statIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  statValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    lineHeight: 30,
  },
  quickSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activityList: {
    gap: spacing.sm,
  },
});
