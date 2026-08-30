import { MessageSquareWarning } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
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

type ComplaintListItemProps = {
  complaint: ComplaintRecord;
  // Takes the complaint rather than being pre-bound to it, so callers can
  // pass a stable setState setter instead of a new inline closure per row -
  // an inline closure here would defeat the memo below.
  onPress: (complaint: ComplaintRecord) => void;
};

// Rendered as a FlashList row (app/complaints/index.tsx) - memoized since
// `complaint` and `onPress` are both stable references at the call sites.
export const ComplaintListItem = memo(function ComplaintListItem({ complaint, onPress }: ComplaintListItemProps) {
  const { colors } = useTheme();
  const tone = priorityTone(complaint.priority, colors);

  return (
    <AnimatedPressable
      onPress={() => onPress(complaint)}
      scaleTo={0.99}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
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
    </AnimatedPressable>
  );
});

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
