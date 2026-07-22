import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { NotificationListItem } from '@/components/shared/NotificationListItem';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';
import type { Notification, NotificationCategory } from '@/services/mockData';
import { formatDate, formatTime } from '@/utils/format';

type DateFilter = 'All' | 'Today' | 'Last 7 Days';
type TypeFilter = 'All' | NotificationCategory;

const dateFilters: { label: string; value: DateFilter }[] = [
  { label: 'All Dates', value: 'All' },
  { label: 'Today', value: 'Today' },
  { label: 'Last 7 Days', value: 'Last 7 Days' },
];
const typeFilters: { label: string; value: TypeFilter }[] = [
  { label: 'All Types', value: 'All' },
  { label: 'Work', value: 'Work' },
  { label: 'Attendance', value: 'Attendance' },
  { label: 'Survey', value: 'Survey' },
  { label: 'System', value: 'System' },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { notifications, markAllAsRead } = useNotifications();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('All');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [dateSelectOpen, setDateSelectOpen] = useState(false);
  const [typeSelectOpen, setTypeSelectOpen] = useState(false);

  const filteredNotifications = notifications.filter((item) => {
    const matchesType = typeFilter === 'All' || item.category === typeFilter;
    const matchesDate = matchesDateFilter(item.createdAt, dateFilter);
    return matchesType && matchesDate;
  });

  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

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
          options={dateFilters}
          open={dateSelectOpen}
          onOpenChange={setDateSelectOpen}
          onChange={setDateFilter}
        />
        <SimpleSelect
          label="Type"
          value={typeFilter}
          options={typeFilters}
          open={typeSelectOpen}
          onOpenChange={setTypeSelectOpen}
          onChange={setTypeFilter}
        />
      </View>

      {sortedNotifications.length ? (
        <View style={styles.list}>
          {sortedNotifications.map((item) => (
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

function matchesDateFilter(value: string, filter: DateFilter) {
  if (filter === 'All') return true;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (filter === 'Today') return itemDay === startOfToday;

  const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
  return itemDay >= sevenDaysAgo && itemDay <= startOfToday;
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
