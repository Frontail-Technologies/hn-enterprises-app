import { ReactNode, isValidElement } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

import { motion } from "@/constants/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function getChildFlexStyle(child: ReactNode): StyleProp<ViewStyle> {
  if (!isValidElement(child)) return undefined;
  const style = (child.props as { style?: StyleProp<ViewStyle> } | null)?.style;
  const flattened = StyleSheet.flatten(style);
  if (!flattened) return undefined;

  const passthrough: ViewStyle = {};
  if (typeof flattened.flex === "number") passthrough.flex = flattened.flex;
  if (flattened.width !== undefined) passthrough.width = flattened.width;
  if (flattened.alignSelf !== undefined) passthrough.alignSelf = flattened.alignSelf;

  return Object.keys(passthrough).length ? passthrough : undefined;
}

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
      entering={FadeInDown.duration(motion.duration.normal)
        .delay(delay)
        .withInitialValues({ opacity: 0, transform: [{ translateY: motion.distance }] })
        .easing(Easing.out(Easing.cubic))}
    >
      {children}
    </Animated.View>
  );
}
