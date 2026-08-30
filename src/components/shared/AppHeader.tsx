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

// Reusable icon-button row (search/filter toggles, etc.) rendered in the
// header's right slot - see Complaints/Activity/Customers/Expenses for the
// expand-a-compact-row-in-bottomContent pattern this is designed for.
export type AppHeaderAction = {
  key: string;
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  // Shows a small dot on the icon - e.g. a non-default filter is applied.
  active?: boolean;
};

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  // Custom right-side content (e.g. Expenses' "Add" button) - renders
  // alongside `actions`, after them, in the same row.
  right?: ReactNode;
  // Icon-button row for the right slot (search/filter toggles, etc.).
  actions?: AppHeaderAction[];
  // Extra row rendered below the title, still inside AppHeader's own sticky
  // container - lets a screen's search/filter controls stay reachable while
  // scrolling instead of living as a separate, non-sticky sibling.
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
                  // Icon-only - opacity feedback reads better than a
                  // noticeable scale on a small tap target like this.
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
    // No marginBottom here anymore - that gap (deliberately colors.background
    // showing below the header's rounded bottom corners, not a continuation
    // of the header's own accent/card color) now lives on Screen's body
    // content as a leading inset instead (see Screen.tsx). Margin here would
    // sit *inside* Screen's sticky-header wrapper's own painted box, which
    // now matches this header's background exactly (see
    // useAppHeaderBackground) specifically so no gap/mismatch is exposed
    // during remount - a margin here would repaint that intentional reveal
    // gap with the header's own color instead of the screen's base color.
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
