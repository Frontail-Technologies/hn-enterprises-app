import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { NotificationListItem } from '@/components/shared/NotificationListItem';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { notificationDateFilters, notificationTypeFilters } from '@/constants/notifications';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { formatDate, formatTime } from '@/utils/format';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications: allNotifications, markAllAsRead } = useNotifications();
  const {
    notifications,
    selectedNotification,
    setSelectedNotification,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    dateSelectOpen,
    setDateSelectOpen,
    typeSelectOpen,
    setTypeSelectOpen,
  } = useNotificationsList(allNotifications);

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader
        title="Notifications"
        left={<BackButton />}
        right={
          <Pressable onPress={markAllAsRead} hitSlop={10} style={styles.markAllButton}>
            <Text style={[typography.label, { color: '#FFFFFF' }]}>Mark all read</Text>
          </Pressable>
        }
      />

      <View style={styles.filtersRow}>
        <SimpleSelect
          label="Date"
          value={dateFilter}
          options={notificationDateFilters}
          open={dateSelectOpen}
          onOpenChange={setDateSelectOpen}
          onChange={setDateFilter}
        />
        <SimpleSelect
          label="Type"
          value={typeFilter}
          options={notificationTypeFilters}
          open={typeSelectOpen}
          onOpenChange={setTypeSelectOpen}
          onChange={setTypeFilter}
        />
      </View>

      {notifications.length ? (
        <View style={styles.list}>
          {notifications.map((item) => (
            <NotificationListItem key={item.id} item={item} onPress={setSelectedNotification} />
          ))}
        </View>
      ) : (
        <EmptyState title="No notifications" description="Try changing the date or type filter." />
      )}

      <Sheet
        visible={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        title="Notification"
      >
        {selectedNotification ? (
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={[styles.categoryPill, { backgroundColor: colors.softOrange }]}>
                <Text style={[styles.categoryText, { color: colors.primary }]}>
                  {selectedNotification.category}
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.muted }]}>
                {formatDate(selectedNotification.createdAt)} : {formatTime(selectedNotification.createdAt)}
              </Text>
            </View>

            <View style={[styles.detailBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>{selectedNotification.title}</Text>
              <Text style={[styles.detailMessage, { color: colors.muted }]}>
                {selectedNotification.message}
              </Text>
            </View>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerAction}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    minWidth: 96,
    minHeight: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  sheetContent: {
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  categoryPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  categoryText: {
    ...typography.label,
    fontSize: 11,
  },
  detailBox: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  detailTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  detailMessage: {
    ...typography.body,
    lineHeight: 22,
  },
});
