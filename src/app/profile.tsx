import { router } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  CircleHelp,
  Info,
  LogOut,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="Profile" left={<BackButton />} />

      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: colors.softOrange }]}>
              <UserRound size={30} color={colors.primary} />
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.nameText, { color: colors.text }]}>{user?.name ?? '-'}</Text>
              <Text style={[styles.roleText, { color: colors.muted }]}>{formatRole(user?.role)}</Text>
              <Text style={[styles.emailText, { color: colors.muted }]}>{user?.email ?? '-'}</Text>
              <Text style={[styles.phoneText, { color: colors.text }]}>{user?.mobile ?? '-'}</Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </View>
        </Card>

        <Card style={styles.menuCard}>
          <Pressable style={styles.menuRow} onPress={toggleTheme}>
            {isDark ? <Sun size={17} color={colors.primary} /> : <Moon size={17} color={colors.primary} />}
            <Text style={[styles.menuLabel, { color: colors.text }]}>Theme</Text>
            <View style={[styles.toggleTrack, { backgroundColor: isDark ? colors.primary : colors.border }]}>
              <View
                style={[
                  styles.toggleThumb,
                  {
                    backgroundColor: colors.card,
                    transform: [{ translateX: isDark ? 18 : 0 }],
                  },
                ]}
              />
            </View>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuRow icon={CircleHelp} label="Support & Help" />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuRow icon={Info} label="About HN Enterprises" />
        </Card>

        <Pressable
          style={[styles.logoutRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <LogOut size={17} color={colors.red} />
          <Text style={[styles.logoutText, { color: colors.red }]}>Logout</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function formatRole(role?: string) {
  if (!role) return '-';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (value) => value.toUpperCase());
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

type MenuRowProps = {
  icon: typeof CircleHelp;
  label: string;
};

function MenuRow({ icon: Icon, label }: MenuRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable style={styles.menuRow}>
      <Icon size={17} color={colors.muted} />
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={17} color={colors.muted} />
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
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
  menuDivider: {
    height: 1,
    marginLeft: 42,
  },
  menuLabel: {
    ...typography.label,
    flex: 1,
    fontSize: 12,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 3,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  logoutRow: {
    height: 46,
    borderWidth: 1,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  logoutText: {
    ...typography.label,
    fontSize: 12,
  },
});
