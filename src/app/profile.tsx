import { router } from 'expo-router';
import { ArrowLeft, CircleHelp, Info, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AccountMenuDivider, AccountMenuRow } from '@/components/profile/AccountMenuRow';
import { AppearanceMenuRow } from '@/components/profile/AppearanceMenuRow';
import { LogoutButton } from '@/components/profile/LogoutButton';
import { ProfileIdentityRow } from '@/components/profile/ProfileIdentityRow';
import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAccountLogout } from '@/hooks/useAccountLogout';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { openPrivacyPolicy } from '@/utils/openPrivacyPolicy';

export default function ProfileScreen() {
  const { user } = useAuth();
  const authGuard = useAuthGuard();
  const { requestLogout, dialog: logoutDialog } = useAccountLogout();
  const { showToast } = useToast();

  if (authGuard.blocked) return authGuard.element;

  return (
    <Screen scroll edges={['bottom']} refreshable={false} contentStyle={styles.screen}>
      <AppHeader title="Profile" left={<BackButton />} />

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <ProfileIdentityRow user={user} />
        </Card>

        <Card style={styles.menuCard}>
          <AppearanceMenuRow />
          <AccountMenuDivider />
          <AccountMenuRow icon={CircleHelp} label="Support & Help" />
          <AccountMenuDivider />
          <AccountMenuRow
            icon={ShieldCheck}
            label="Privacy Policy"
            onPress={() => openPrivacyPolicy(showToast)}
          />
          <AccountMenuDivider />
          <AccountMenuRow icon={Info} label="About HN Enterprises" />
        </Card>

        <LogoutButton onPress={requestLogout} borderRadius={radius.sm} />
      </View>
      {logoutDialog}
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
  },
  profileCard: {
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radius.sm,
  },
});
