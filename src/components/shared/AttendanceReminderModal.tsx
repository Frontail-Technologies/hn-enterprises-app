import { router } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { guardNavigation } from '@/lib/navigation';
import { addActionBreadcrumb } from '@/lib/sentry';

type AttendanceReminderModalProps = {
  visible: boolean;
  onClose: () => void;
};

// Centered dialog, not the shared bottom Sheet - this reminder is a brief
// act-or-dismiss nudge, not a task with its own scrollable content, so a
// small centered card fits better than a swipe-up sheet. Built directly on
// React Native's own Modal (same pattern already used by EvidenceUploader's
// preview dialog) rather than introducing a new modal framework.
//
// visible/onClose stay owned by the caller (AttendanceSummarySection) - the
// scheduling/one-shot-gate logic that decides *when* visible flips true is
// untouched, so this component only ever reflects a single boolean, and
// React Native's Modal fully unmounts its backdrop+content the instant
// visible is false. That's what guarantees at most one reminder is ever
// mounted and that a closed modal never leaves a backdrop intercepting
// touches - there's no imperative present/dismiss handle to get out of sync.
export function AttendanceReminderModal({ visible, onClose }: AttendanceReminderModalProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  // The card mounts fresh every time (Modal fully unmounts on visible=false
  // - see this file's top comment), so a plain mount effect below doubles
  // as the "entrance" trigger - no need for Reanimated's entering/exiting
  // API, which would need the card to stay mounted through Modal's own
  // teardown to play an exit animation, undermining that same guarantee.
  const cardOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const cardScale = useSharedValue(reduceMotion ? 1 : 0.96);

  useEffect(() => {
    if (reduceMotion) return;
    cardOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    cardScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [reduceMotion, cardOpacity, cardScale]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  // Same Sentry category/name the old Sheet emitted ("sheet"/"attendance_reminder")
  // - kept as-is for continuity with any existing breadcrumb-based dashboards,
  // even though this is no longer literally a Sheet.
  const handleClose = () => {
    addActionBreadcrumb('sheet', 'dismissed', { name: 'attendance_reminder' });
    onClose();
  };

  const handleCheckIn = () => {
    addActionBreadcrumb('sheet', 'dismissed', { name: 'attendance_reminder' });
    onClose();
    guardNavigation(() => router.push('/attendance'));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      // Android hardware back fires this - required for Android to handle
      // back at all on a transparent Modal. iOS has no swipe-down gesture on
      // a plain transparent Modal to begin with, so there's nothing to
      // suppress there.
      onRequestClose={handleClose}
      onShow={() => addActionBreadcrumb('sheet', 'opened', { name: 'attendance_reminder' })}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Swallows taps so they don't bubble to the backdrop Pressable above -
            only tapping outside the card should dismiss. RN Modal's own
            animationType="fade" already handles the backdrop fade and (on
            close) the whole modal's exit - cardStyle layers a very small
            scale-in on top of that for the card's own appearance only. */}
        <Animated.View style={[styles.card, { backgroundColor: colors.card }, cardStyle]}>
          <Pressable style={styles.cardContent} onPress={() => undefined}>
            <View style={[styles.iconCircle, { borderColor: colors.primary }]}>
              <BellRing size={26} color={colors.primary} />
            </View>
            <Text style={[typography.h2, styles.title, { color: colors.text }]}>Check-in Pending</Text>
            <Text style={[typography.body, styles.message, { color: colors.muted }]}>
              Please check in with your current location before starting field work.
            </Text>
            <View style={styles.actions}>
              <Button label="Check In Now" onPress={handleCheckIn} />
              <Button label="Remind Me Later" variant="outline" onPress={handleClose} />
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
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderRadius: 27,
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
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
