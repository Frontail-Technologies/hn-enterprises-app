import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';
import { Sheet } from './Sheet';

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive,
}: ConfirmSheetProps) {
  const { colors } = useTheme();

  return (
    <Sheet visible={visible} onClose={onCancel} title={title}>
      <View style={styles.content}>
        <Text style={[styles.copy, { color: colors.muted }]}>{message}</Text>
        <View style={styles.actions}>
          <Button label={cancelLabel} variant="outline" fullWidth={false} onPress={onCancel} style={styles.actionButton} />
          <Button
            label={confirmLabel}
            variant={destructive ? 'destructive' : 'primary'}
            fullWidth={false}
            onPress={onConfirm}
            style={styles.actionButton}
          />
        </View>
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
});
