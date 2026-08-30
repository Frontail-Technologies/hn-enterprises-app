import { router } from "expo-router";
import { useState } from "react";
import { Bell, CircleHelp, Info, LockKeyhole, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChangePasswordSheet } from "@/components/auth/ChangePasswordSheet";
import { AccountMenuDivider, AccountMenuRow } from "@/components/profile/AccountMenuRow";
import { AppearanceMenuRow } from "@/components/profile/AppearanceMenuRow";
import { LogoutButton } from "@/components/profile/LogoutButton";
import { ProfileIdentityRow } from "@/components/profile/ProfileIdentityRow";
import { AppHeader } from "@/components/shared/AppHeader";
import { Card } from "@/components/ui/Card";
import { RevealGroup } from "@/components/ui/RevealGroup";
import { Screen } from "@/components/ui/Screen";
import { radius, spacing } from "@/constants/spacing";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationsContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useAccountLogout } from "@/hooks/useAccountLogout";
import { guardNavigation } from "@/lib/navigation";
import { openPrivacyPolicy } from "@/utils/openPrivacyPolicy";
import { openSupportPage } from "@/utils/openSupportPage";

export default function MoreScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { showToast } = useToast();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const { requestLogout, dialog: logoutDialog } = useAccountLogout();

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
            <AppearanceMenuRow />
            <AccountMenuDivider />
            <AccountMenuRow icon={LockKeyhole} label="Change Password" onPress={() => setChangePasswordOpen(true)} />
            <AccountMenuDivider />
            <AccountMenuRow icon={CircleHelp} label="Support & Help" onPress={() => openSupportPage(showToast)} />
            <AccountMenuDivider />
            <AccountMenuRow
              icon={ShieldCheck}
              label="Privacy Policy"
              onPress={() => openPrivacyPolicy(showToast)}
            />
            <AccountMenuDivider />
            <AccountMenuRow icon={Info} label="About HN Enterprises" />
          </Card>

          <LogoutButton onPress={requestLogout} borderRadius={radius.lg} />
        </RevealGroup>
      </View>

      <ChangePasswordSheet visible={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
      {logoutDialog}
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
});
