import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { guardNavigation } from '@/lib/navigation';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';

type AttendanceReminderSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function AttendanceReminderSheet({ visible, onClose }: AttendanceReminderSheetProps) {
  const { colors } = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose} title="Check-in Pending" sentryName="attendance_reminder">
      <View style={styles.content}>
        <Text style={[styles.copy, { color: colors.muted }]}>
          {"Please check in with your current location before starting field work."}
        </Text>
        <Button
          label="Check In Now"
          onPress={() => {
            onClose();
            guardNavigation(() => router.push('/attendance'));
          }}
        />
        <Button label="Remind Me Later" variant="outline" onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  copy: {
    ...typography.body,
    lineHeight: 22,
  },
});
