import { router } from "expo-router";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Info,
  LockKeyhole,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChangePasswordSheet } from "@/components/auth/ChangePasswordSheet";
import { AppHeader } from "@/components/shared/AppHeader";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Switch } from "@/components/ui/Switch";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { guardNavigation } from "@/lib/navigation";

export default function MoreScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <Screen scroll tabBarAware edges={["bottom"]} refreshable={false} contentStyle={styles.screen}>
      <AppHeader
        title="Profile"
        right={
          <Pressable
            onPress={() => guardNavigation(() => router.push("/notifications"))}
            style={styles.bellButton}
          >
            <Bell size={20} color="#FFFFFF" />
            {unreadCount ? (
              <View
                style={[
                  styles.notificationDot,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.notificationText}>{unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <View style={styles.content}>
        <Card elevated style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View
              style={[styles.avatar, { backgroundColor: colors.softOrange }]}
            >
              <UserRound size={30} color={colors.primary} />
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.nameText, { color: colors.text }]}>
                {user?.name ?? "-"}
              </Text>
              <Text style={[styles.roleText, { color: colors.text }]}>
                {formatRole(user?.role)}
              </Text>
              <Text style={[styles.emailText, { color: colors.muted }]}>
                {user?.email ?? "-"}
              </Text>
              <Text style={[styles.phoneText, { color: colors.text }]}>
                {user?.mobile ?? "-"}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </View>
        </Card>

        <Card flat style={styles.menuCard}>
          <View style={styles.menuRow}>
            {isDark ? (
              <Sun size={17} color={colors.primary} />
            ) : (
              <Moon size={17} color={colors.primary} />
            )}
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              Theme
            </Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
          <View
            style={[styles.menuDivider, { backgroundColor: colors.border }]}
          />
          <MenuRow icon={LockKeyhole} label="Change Password" onPress={() => setChangePasswordOpen(true)} />
          <View
            style={[styles.menuDivider, { backgroundColor: colors.border }]}
          />
          <MenuRow icon={CircleHelp} label="Support & Help" />
          <View
            style={[styles.menuDivider, { backgroundColor: colors.border }]}
          />
          <MenuRow icon={Info} label="About HN Enterprises" />
        </Card>

        <Pressable
          style={[
            styles.logoutRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={handleLogout}
        >
          <LogOut size={17} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Logout</Text>
        </Pressable>
      </View>

      <ChangePasswordSheet visible={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </Screen>
  );
}

function formatRole(role?: string) {
  if (!role) return "-";
  return role.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

type MenuRowProps = {
  icon: typeof CircleHelp;
  label: string;
  onPress?: () => void;
};

function MenuRow({ icon: Icon, label, onPress }: MenuRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Icon size={17} color={colors.muted} />
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={17} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 106,
  },
  bellButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 4,
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  profileCard: {
    padding: spacing.md,
    borderRadius: 22,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCopy: {
    flex: 1,
    gap: 1,
  },
  nameText: {
    ...typography.caption,
    fontSize: 13,
  },
  roleText: {
    ...typography.label,
    fontSize: 11,
  },
  emailText: {
    ...typography.label,
  },
  phoneText: {
    ...typography.label,
    marginTop: 1,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 13,
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: radius.lg,
  },
  areaRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  areaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    ...typography.label,
    fontSize: 13,
  },
  rowSubtitle: {
    ...typography.label,
    fontSize: 11,
  },
  viewAllButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    ...typography.label,
    fontSize: 12,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: radius.lg,
  },
  menuRow: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuDivider: {
    height: 1,
    marginLeft: 42,
  },
  menuLabel: {
    ...typography.label,
    flex: 1,
    fontSize: 12,
  },
  logoutRow: {
    height: 46,
    borderWidth: 1,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  logoutText: {
    ...typography.label,
    fontSize: 12,
  },
});
