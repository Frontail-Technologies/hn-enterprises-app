import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { addActionBreadcrumb } from '@/lib/sentry';

type ConfirmationDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
  sentryName?: string;
};

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive,
  loading,
  sentryName = 'confirmation',
}: ConfirmationDialogProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const cardOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const cardScale = useSharedValue(reduceMotion ? 1 : 0.96);

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      cardOpacity.value = 1;
      cardScale.value = 1;
    } else {
      cardOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      cardScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    }
    addActionBreadcrumb('dialog', 'opened', { name: sentryName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduceMotion]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const handleCancel = () => {
    addActionBreadcrumb('dialog', 'dismissed', { name: sentryName });
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Animated.View style={[styles.card, { backgroundColor: colors.card }, cardStyle]}>
          <Pressable style={styles.cardContent} onPress={() => undefined}>
            <Text style={[typography.h2, styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[typography.body, styles.message, { color: colors.muted }]}>{message}</Text>
            <View style={styles.actions}>
              <Button
                label={cancelLabel}
                variant="outline"
                fullWidth={false}
                onPress={handleCancel}
                style={styles.actionButton}
              />
              <Button
                label={confirmLabel}
                variant={destructive ? 'destructive' : 'primary'}
                fullWidth={false}
                loading={loading}
                onPress={onConfirm}
                style={styles.actionButton}
              />
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  cardContent: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  message: {
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
});
