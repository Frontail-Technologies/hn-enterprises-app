import { ReactNode, isValidElement } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

import { motion } from "@/constants/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Reveal's own Animated.View wraps a child without otherwise changing its
// layout - but that wrapper is itself just a plain View, so a child relying
// on flex: 1 to claim/center within its parent's remaining space (e.g. an
// EmptyState/ErrorState with `fill`, wrapped in a flex: 1 View so this can
// detect it) needs that same flex passed through to the wrapper, or the
// wrapper collapses to content size and the child's flex: 1 has nothing
// real to expand into. Shared by Screen.tsx and RevealGroup.tsx, the two
// places that wrap arbitrary children in Reveal.
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
