import { CalendarDays, ClipboardList, FileText, Info } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';
import type { Notification, NotificationCategory } from '@/types/notifications';
import { getRelativeTime } from '@/utils/date';

type NotificationListItemProps = {
  item: Notification;
  onPress?: (item: Notification) => void;
};

// Rendered as a FlashList row - memoized because `item`/`onPress` are
// referentially stable across unrelated parent re-renders (a raw setState
// setter, not an inline closure), so memo actually skips work here.
export const NotificationListItem = memo(function NotificationListItem({ item, onPress }: NotificationListItemProps) {
  const { colors } = useTheme();
  const { markAsRead } = useNotifications();
  const tone = getCategoryTone(item.category, colors);

  return (
    <Pressable
      onPress={() => {
        markAsRead(item.id);
        onPress?.(item);
      }}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.82 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.background }]}>
        <CategoryIcon category={item.category} color={tone.color} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
        </View>
        <Text style={[styles.message, { color: colors.muted }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[typography.caption, { color: colors.muted }]}>
          {getRelativeTime(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
});

function CategoryIcon({ category, color }: { category: NotificationCategory; color: string }) {
  if (category === 'Attendance') return <CalendarDays size={18} color={color} />;
  if (category === 'Survey') return <FileText size={18} color={color} />;
  if (category === 'System') return <Info size={18} color={color} />;
  return <ClipboardList size={18} color={color} />;
}

function getCategoryTone(category: NotificationCategory, colors: ReturnType<typeof useTheme>['colors']) {
  if (category === 'Attendance') return { color: colors.green, background: '#DCFCE7' };
  if (category === 'Survey') return { color: colors.accent, background: colors.softBlue };
  if (category === 'System') return { color: colors.muted, background: '#F1F5F9' };
  return { color: colors.primary, background: colors.card };
}

const styles = StyleSheet.create({
  row: {
    minHeight: 82,
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyMedium,
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
  message: {
    ...typography.label,
    fontSize: 12,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
