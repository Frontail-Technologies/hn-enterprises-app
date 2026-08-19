import { CalendarDays, ClipboardList, FileText, Info, Trash2 } from 'lucide-react-native';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

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
  const { markAsRead, deleteNotification } = useNotifications();
  const tone = getCategoryTone(item.category, colors);

  // Swiping right reveals a delete action behind the row (on the left) -
  // deletes just this user's copy, per notifications.service.ts#remove on
  // the backend (each row already belongs to exactly one user).
  const renderLeftActions = useCallback(
    (progress: SharedValue<number>) => (
      <DeleteAction progress={progress} color={colors.red} onPress={() => deleteNotification(item.id)} />
    ),
    [colors.red, deleteNotification, item.id],
  );

  return (
    <Swipeable renderLeftActions={renderLeftActions} overshootLeft={false}>
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
    </Swipeable>
  );
});

function DeleteAction({
  progress,
  color,
  onPress,
}: {
  progress: SharedValue<number>;
  color: string;
  onPress: () => void;
}) {
  // Fades in as the row is dragged open rather than snapping to full
  // opacity immediately, so a small/aborted swipe doesn't flash a solid
  // red panel before springing back closed.
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return (
    <Animated.View style={[styles.deleteAction, { backgroundColor: color }, animatedStyle]}>
      <Pressable onPress={onPress} style={styles.deleteButton} hitSlop={8}>
        <Trash2 size={20} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

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
  deleteAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  deleteButton: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
