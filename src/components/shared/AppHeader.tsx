import { StatusBar } from "expo-status-bar";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion } from "react-native-reanimated";

import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { pagePadding, radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAppHeaderBackground } from "@/hooks/useAppHeaderBackground";

export type AppHeaderAction = {
  key: string;
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  active?: boolean;
};

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  actions?: AppHeaderAction[];
  bottomContent?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AppHeader({
  title,
  subtitle,
  left,
  right,
  actions,
  bottomContent,
  style,
}: AppHeaderProps) {
  const headerBackground = useAppHeaderBackground();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" />
      <Animated.View
        layout={LinearTransition.duration(180).reduceMotion(ReduceMotion.System)}
        style={[
          styles.header,
          {
            backgroundColor: headerBackground,
            paddingTop: insets.top + spacing.lg,
          },
          style,
        ]}
      >
        <View style={styles.titleRow}>
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
          {actions?.length || right ? (
            <View style={styles.actionsRow}>
              {actions?.map(({ key, icon: Icon, onPress, accessibilityLabel, active }) => (
                <AnimatedPressable
                  key={key}
                  onPress={onPress}
                  accessibilityRole="button"
                  accessibilityLabel={accessibilityLabel}
                  hitSlop={6}
                  scaleTo={1}
                  style={styles.actionButton}
                >
                  <Icon size={20} color="#FFFFFF" />
                  {active ? <View style={styles.actionDot} /> : null}
                </AnimatedPressable>
              ))}
              {right ? <View style={styles.rightAction}>{right}</View> : null}
            </View>
          ) : null}
        </View>
        {bottomContent ? (
          <Animated.View
            entering={FadeIn.duration(140).reduceMotion(ReduceMotion.System)}
            exiting={FadeOut.duration(100).reduceMotion(ReduceMotion.System)}
            style={styles.bottomContent}
          >
            {bottomContent}
          </Animated.View>
        ) : null}
      </Animated.View>
    </>
  );
}

AppHeader.displayName = "AppHeader";
AppHeader.isStickyHeader = true;

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    paddingHorizontal: pagePadding,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
    zIndex: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  bottomContent: {
    marginTop: spacing.md,
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
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
