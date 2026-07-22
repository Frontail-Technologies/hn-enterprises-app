import { CalendarDays, ClipboardList, FileText, Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { ActivityLogEntry, NotificationCategory } from '@/services/mockData';
import { getRelativeTime } from '@/utils/date';

export function ActivityListItem({ item }: { item: ActivityLogEntry }) {
  const { colors } = useTheme();
  const tone = getCategoryTone(item.category, colors);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: tone.background }]}>
        <CategoryIcon category={item.category} color={tone.color} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <Text style={[typography.caption, { color: colors.muted }]}>
        {getRelativeTime(item.timestamp)}
      </Text>
    </View>
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
  return { color: colors.primary, background: colors.softOrange };
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 2,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  description: {
    ...typography.label,
    fontSize: 12,
    lineHeight: 17,
  },
});
