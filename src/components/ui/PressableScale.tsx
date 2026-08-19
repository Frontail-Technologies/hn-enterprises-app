import { ReactNode } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import { motion } from "@/constants/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Subtle, consistent press feedback for a card/row that otherwise has none -
// scales to motion.pressScale on press, springs back on release. Opacity/
// transform only, so it's cheap even inside a FlashList row. Not a
// replacement for the opacity-dimming Pressables already used elsewhere in
// this app - those already give feedback; this is for filling genuine gaps.
export function PressableScale({ children, style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      style={[style, reduceMotion ? undefined : animatedStyle]}
      onPressIn={(event) => {
        // Reanimated shared values are mutated via `.value` by design - the
        // UI thread reads that mutation directly, outside React's render
        // cycle - so react-hooks/immutability's plain-object assumption
        // doesn't apply here.
        // eslint-disable-next-line react-hooks/immutability
        if (!reduceMotion) scale.value = withTiming(motion.pressScale, { duration: motion.duration.fast });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability
        if (!reduceMotion) scale.value = withSpring(1, { damping: 16, stiffness: 260 });
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
