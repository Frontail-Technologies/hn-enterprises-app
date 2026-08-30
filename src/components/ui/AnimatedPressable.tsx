import { forwardRef } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  scaleTo?: number;
  opacityTo?: number;
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
