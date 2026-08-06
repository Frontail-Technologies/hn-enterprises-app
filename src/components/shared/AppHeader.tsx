import { ReactNode } from "react";
import { StatusBar, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppHeader({ title, subtitle, left, right, style }: AppHeaderProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDark ? colors.card : colors.accent}
        translucent={false}
      />
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.card : colors.accent,
            paddingTop: insets.top + spacing.lg,
          },
          style,
        ]}
      >
        {left ? <View style={styles.sideAction}>{left}</View> : null}
        <View style={styles.left}>
          <View style={styles.titleWrap}>
            <Text
              style={[typography.h1, styles.title, { color: "#FFFFFF" }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  typography.caption,
                  { color: "rgba(255, 255, 255, 0.82)" },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {right ? <View style={styles.rightAction}>{right}</View> : null}
      </View>
    </>
  );
}

AppHeader.displayName = "AppHeader";

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginHorizontal: -20,
    marginBottom: spacing.md,
    paddingHorizontal: 20,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  sideAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rightAction: {
    minHeight: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  left: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleWrap: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
});
