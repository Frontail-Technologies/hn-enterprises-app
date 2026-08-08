import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

import { motion } from "@/constants/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type RevealProps = {
  index?: number;
  stagger?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Reveal({ index = 0, stagger = true, children, style }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <View style={style}>{children}</View>;
  }

  const delay = stagger ? Math.min(index * motion.staggerStep, motion.staggerCap) : 0;

  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(motion.duration)
        .delay(delay)
        .withInitialValues({ opacity: 0, transform: [{ translateY: motion.distance }] })
        .easing(Easing.out(Easing.cubic))}
    >
      {children}
    </Animated.View>
  );
}
