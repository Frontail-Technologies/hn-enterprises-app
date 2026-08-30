import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

// Shared UI-thread press-feedback for tappable surfaces app-wide (Button,
// list cards, AppHeader action icons, bottom-tab buttons, etc.) - one
// consistent "feels responsive" pattern instead of each screen hand-rolling
// its own opacity snap. See AGENTS/ticket notes: press-in scales down and
// dims very slightly, release eases back - fast and subtle, never a bounce.
export type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  // 1 disables the scale entirely - use for icon-only controls, where a
  // noticeable scale reads as jittery rather than responsive.
  scaleTo?: number;
  opacityTo?: number;
  // Static only, unlike Pressable's own `style` - press feedback is already
  // handled internally, so there's no `pressed` state left for a caller's
  // style function to react to.
  style?: StyleProp<ViewStyle>;
};

const PRESS_DURATION = 100;
const RELEASE_DURATION = 140;

export const AnimatedPressable = forwardRef<View, AnimatedPressableProps>(function AnimatedPressable(
  { scaleTo = 0.985, opacityTo = 0.92, style, onPressIn, onPressOut, disabled, children, ...rest },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableBase
      ref={ref}
      disabled={disabled}
      onPressIn={(event) => {
        // Scale is a spatial motion cue (what reduced-motion settings target)
        // - opacity is a plain state change, kept even under reduced motion
        // so a press still visibly registers (see the ticket's own
        // accessibility guidance: retain feedback, drop the motion).
        if (!reduceMotion) {
          scale.value = withTiming(scaleTo, { duration: PRESS_DURATION, easing: Easing.out(Easing.quad) });
        }
        opacity.value = withTiming(opacityTo, { duration: PRESS_DURATION });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (!reduceMotion) {
          scale.value = withTiming(1, { duration: RELEASE_DURATION, easing: Easing.out(Easing.quad) });
        }
        opacity.value = withTiming(1, { duration: RELEASE_DURATION });
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
});
