import { MessageSquareWarning } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { ComplaintPriority, ComplaintRecord } from '@/services/complaints.service';
import { getRelativeTime } from '@/utils/date';

function priorityTone(priority: ComplaintPriority, colors: ReturnType<typeof useTheme>['colors']) {
  if (priority === 'high') return { color: colors.red, background: '#FEE2E2' };
  if (priority === 'medium') return { color: colors.primary, background: colors.softOrange };
  return { color: colors.blue, background: colors.softBlue };
}

export function ComplaintListItem({ complaint, onPress }: { complaint: ComplaintRecord; onPress: () => void }) {
  const { colors } = useTheme();
  const tone = priorityTone(complaint.priority, colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.72 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.background }]}>
        <MessageSquareWarning size={18} color={tone.color} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {complaint.title}
        </Text>
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {complaint.customerName || 'Customer'}
        </Text>
      </View>
      <Text style={[typography.caption, { color: colors.muted }]}>{getRelativeTime(complaint.createdAt)}</Text>
    </Pressable>
  );
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
