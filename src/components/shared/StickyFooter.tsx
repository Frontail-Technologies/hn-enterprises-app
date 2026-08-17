import { PropsWithChildren, useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";

import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/ThemeContext";

export function StickyFooter({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.footer,
        {
          opacity,
          paddingBottom: spacing.md,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
