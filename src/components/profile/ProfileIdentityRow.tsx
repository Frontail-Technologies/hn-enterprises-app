import { ChevronRight, UserRound } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { AuthUser } from '@/types/auth';
import { formatRole } from '@/utils/format';

export function ProfileIdentityRow({ user, roleColor }: { user: AuthUser | null; roleColor?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.profileRow}>
      <View style={[styles.avatar, { backgroundColor: colors.softOrange }]}>
        <UserRound size={30} color={colors.primary} />
      </View>
      <View style={styles.profileCopy}>
        <Text style={[styles.nameText, { color: colors.text }]}>{user?.name ?? '-'}</Text>
        <Text style={[styles.roleText, { color: roleColor ?? colors.muted }]}>{formatRole(user?.role)}</Text>
        <Text style={[styles.emailText, { color: colors.muted }]}>{user?.email ?? '-'}</Text>
        <Text style={[styles.phoneText, { color: colors.text }]}>{user?.mobile ?? '-'}</Text>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
