import { router } from "expo-router";
import { useState } from "react";
import { Bell, CircleHelp, Info, LockKeyhole, Moon, Sun } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChangePasswordSheet } from "@/components/auth/ChangePasswordSheet";
import { AccountMenuDivider, AccountMenuRow } from "@/components/profile/AccountMenuRow";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileIdentityRow } from "@/components/profile/ProfileIdentityRow";
import { AppHeader } from "@/components/shared/AppHeader";
import { Card } from "@/components/ui/Card";
import { RevealGroup } from "@/components/ui/RevealGroup";
import { Screen } from "@/components/ui/Screen";
import { Switch } from "@/components/ui/Switch";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useAccountLogout } from "@/hooks/useAccountLogout";
import { guardNavigation } from "@/lib/navigation";

export default function MoreScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const handleLogout = useAccountLogout();

  return (
    <Screen scroll tabBarAware edges={["bottom"]} refreshable={false} contentStyle={styles.screen} revealContent={false}>
      <AppHeader
        title="Profile"
        right={
          <Pressable
            onPress={() => guardNavigation(() => router.push("/notifications"))}
            style={styles.bellButton}
          >
            <Bell size={20} color="#FFFFFF" />
            {unreadCount ? (
              <View style={[styles.notificationDot, { backgroundColor: colors.primary }]}>
                <Text style={styles.notificationText}>{unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <View style={styles.content}>
        <RevealGroup>
          <Card elevated style={styles.profileCard}>
            <ProfileIdentityRow user={user} roleColor={colors.text} />
          </Card>

          <Card flat style={styles.menuCard}>
            <View style={styles.menuRow}>
              {isDark ? <Sun size={17} color={colors.primary} /> : <Moon size={17} color={colors.primary} />}
              <Text style={[styles.menuLabel, { color: colors.text }]}>Theme</Text>
              <Switch value={isDark} onValueChange={toggleTheme} />
            </View>
            <AccountMenuDivider />
            <AccountMenuRow icon={LockKeyhole} label="Change Password" onPress={() => setChangePasswordOpen(true)} />
            <AccountMenuDivider />
            <AccountMenuRow icon={CircleHelp} label="Support & Help" />
            <AccountMenuDivider />
            <AccountMenuRow icon={Info} label="About HN Enterprises" />
          </Card>

          <LogoutButton onPress={handleLogout} borderRadius={radius.lg} />
        </RevealGroup>
      </View>

      <ChangePasswordSheet visible={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </Screen>
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
  menuLabel: {
    ...typography.label,
    flex: 1,
    fontSize: 12,
  },
});
