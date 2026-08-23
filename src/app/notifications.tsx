import { FlashList } from '@shopify/flash-list';
import { Redirect, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ComplaintBoxSkeleton } from '@/components/shared/ComplaintBoxSkeleton';
import { NotificationListItem } from '@/components/shared/NotificationListItem';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { notificationDateFilters, notificationTypeFilters } from '@/constants/notifications';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { formatDate, formatTime } from '@/utils/format';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { notifications: allNotifications, markAllAsRead, isLoading } = useNotifications();
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

  const hasFilter = dateFilter !== 'All' || typeFilter !== 'All';

  // No shared route-group layout covers this screen, so it guards itself
  // like ProtectedStack does elsewhere - important here since it's also the
  // route most likely opened directly from a notification tap.
  if (authLoading) return null;
  if (!isAuthenticated) return <Redirect href="/auth/login" />;

  return (
    <Screen scroll={false} edges={['bottom']} contentStyle={styles.screen} revealContent={false}>
      <AppHeader
        title="Notifications"
        left={<BackButton />}
        right={
          <Pressable onPress={markAllAsRead} hitSlop={10} style={styles.markAllButton}>
            <Text style={[typography.label, styles.markAllText]}>Mark all read</Text>
          </Pressable>
        }
      />

      <FlashList
        style={styles.flex}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotificationListItem item={item} onPress={setSelectedNotification} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
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
        }
        ListEmptyComponent={
          isLoading ? (
            <ComplaintBoxSkeleton />
          ) : (
            <EmptyState
              fill
              title={hasFilter ? 'No matching notifications' : 'No notifications'}
              description={hasFilter ? 'Try changing or clearing your filters.' : "You're all caught up."}
            />
          )
        }
        contentContainerStyle={styles.listContent}
      />

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

            {selectedNotification.imageUrl ? (
              <Image
                source={{ uri: selectedNotification.imageUrl }}
                style={[styles.detailImage, { backgroundColor: colors.border }]}
                resizeMode="cover"
              />
            ) : null}

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
  },
  flex: {
    flex: 1,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllButton: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    color: '#FFFFFF',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xl,
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
  detailImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
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
