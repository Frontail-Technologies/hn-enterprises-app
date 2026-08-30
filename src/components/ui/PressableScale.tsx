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
