import { router } from 'expo-router';
import { ArrowLeft, CircleHelp, Info, Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountMenuDivider, AccountMenuRow } from '@/components/profile/AccountMenuRow';
import { LogoutButton } from '@/components/profile/LogoutButton';
import { ProfileIdentityRow } from '@/components/profile/ProfileIdentityRow';
import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Switch } from '@/components/ui/Switch';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAccountLogout } from '@/hooks/useAccountLogout';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const authGuard = useAuthGuard();
  const handleLogout = useAccountLogout();

  // No _layout.tsx covers this route - it guards itself via the same
  // centralized check ProtectedStack uses for grouped routes.
  if (authGuard.blocked) return authGuard.element;

  return (
    <Screen scroll edges={['bottom']} refreshable={false} contentStyle={styles.screen}>
      <AppHeader title="Profile" left={<BackButton />} />

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <ProfileIdentityRow user={user} />
        </Card>

        <Card style={styles.menuCard}>
          <View style={styles.menuRow}>
            {isDark ? <Sun size={17} color={colors.primary} /> : <Moon size={17} color={colors.primary} />}
            <Text style={[styles.menuLabel, { color: colors.text }]}>Theme</Text>
            <Switch value={isDark} onValueChange={toggleTheme} />
          </View>
          <AccountMenuDivider />
          <AccountMenuRow icon={CircleHelp} label="Support & Help" />
          <AccountMenuDivider />
          <AccountMenuRow icon={Info} label="About HN Enterprises" />
        </Card>

        <LogoutButton onPress={handleLogout} borderRadius={radius.sm} />
      </View>
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
  menuRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuLabel: {
    ...typography.label,
    flex: 1,
    fontSize: 12,
  },
});
