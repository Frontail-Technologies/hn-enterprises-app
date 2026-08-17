import { PropsWithChildren } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { radius, spacing } from "@/constants/spacing";
import { useTheme } from "@/context/ThemeContext";

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  flat?: boolean;
}>;

export function Card({ children, style, elevated, flat }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card },
        flat ? null : { borderWidth: 1, borderColor: colors.border },
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  elevated: Platform.select({
    ios: {
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
});
