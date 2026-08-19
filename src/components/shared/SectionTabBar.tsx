import { useCallback, useEffect, useRef } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { motion } from "@/constants/motion";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { CompletionStatus } from "@/types/customers";

export type SectionTab = {
  key: string;
  label: string;
  status?: CompletionStatus;
};

type SectionTabBarProps = {
  tabs: SectionTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

const SCROLL_INTO_VIEW_PADDING = 8;

export function SectionTabBar({
  tabs,
  activeKey,
  onChange,
}: SectionTabBarProps) {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const viewportWidthRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const tabLayoutsRef = useRef<Map<string, { x: number; width: number }>>(
    new Map(),
  );
  const isDraggingRef = useRef(false);
  const dragEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  // Slides the underline to whichever tab's measured layout is passed in.
  // `animate: false` is used for the initial snap-into-place once a tab's
  // layout is first measured (nothing to animate from yet); tab changes
  // afterwards animate.
  const moveIndicator = useCallback(
    (key: string, animate: boolean) => {
      const layout = tabLayoutsRef.current.get(key);
      if (!layout) return;
      // Reanimated shared values are mutated via `.value` by design (the UI
      // thread reads that mutation directly, outside React's render cycle) -
      // react-hooks/immutability doesn't model that escape hatch and flags
      // it as if it were a plain object, so it's disabled here specifically.
      if (animate && !reduceMotion) {
        // eslint-disable-next-line react-hooks/immutability
        indicatorX.value = withTiming(layout.x, { duration: motion.duration.normal });
        // eslint-disable-next-line react-hooks/immutability
        indicatorWidth.value = withTiming(layout.width, { duration: motion.duration.normal });
      } else {
        indicatorX.value = layout.x;
        indicatorWidth.value = layout.width;
      }
    },
    [reduceMotion, indicatorX, indicatorWidth],
  );

  useEffect(() => {
    moveIndicator(activeKey, true);
  }, [activeKey, moveIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const handleViewportLayout = (event: LayoutChangeEvent) => {
    viewportWidthRef.current = event.nativeEvent.layout.width;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
  };

  const handleScrollBeginDrag = () => {
    if (dragEndTimerRef.current) clearTimeout(dragEndTimerRef.current);
    isDraggingRef.current = true;
  };

  const handleScrollEndDrag = () => {
    // Keep the drag guard up briefly after release - the tap that ends a swipe
    // still fires onPress on whichever tab the finger lands on otherwise.
    if (dragEndTimerRef.current) clearTimeout(dragEndTimerRef.current);
    dragEndTimerRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleTabLayout = (key: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayoutsRef.current.set(key, { x, width });
    if (key === activeKey) moveIndicator(key, false);
  };

  const scrollTabIntoView = useCallback(
    (key: string) => {
      if (tabs[0]?.key === key) {
        scrollOffsetRef.current = 0;
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
        return;
      }

      const layout = tabLayoutsRef.current.get(key);
      const viewportWidth = viewportWidthRef.current;
      if (!layout || !viewportWidth) return;

      const currentOffset = scrollOffsetRef.current;
      const tabStart = layout.x;
      const tabEnd = layout.x + layout.width;

      if (tabStart < currentOffset + SCROLL_INTO_VIEW_PADDING) {
        scrollViewRef.current?.scrollTo({
          x: Math.max(0, tabStart - SCROLL_INTO_VIEW_PADDING),
          animated: true,
        });
      } else if (
        tabEnd >
        currentOffset + viewportWidth - SCROLL_INTO_VIEW_PADDING
      ) {
        scrollViewRef.current?.scrollTo({
          x: tabEnd - viewportWidth + SCROLL_INTO_VIEW_PADDING,
          animated: true,
        });
      }
    },
    [tabs],
  );

  const handlePress = (key: string) => {
    if (isDraggingRef.current) return;
    onChange(key);
    scrollTabIntoView(key);
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollTabIntoView(activeKey), 40);
    return () => clearTimeout(timer);
  }, [activeKey, scrollTabIntoView]);

  useEffect(() => {
    return () => {
      if (dragEndTimerRef.current) clearTimeout(dragEndTimerRef.current);
    };
  }, []);

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      style={[styles.scroll]}
      contentContainerStyle={styles.scrollContent}
      onLayout={handleViewportLayout}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollBegin={handleScrollBeginDrag}
      onMomentumScrollEnd={handleScrollEndDrag}
      scrollEventThrottle={16}
    >
      <View style={[styles.row]}>
        {tabs.map((tab) => {
          const active = tab.key === activeKey;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handlePress(tab.key)}
              onLayout={handleTabLayout(tab.key)}
              hitSlop={{ top: 6, bottom: 6 }}
              style={styles.tab}
            >
              <View style={[styles.tabContent]}>
                {tab.status ? (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          tab.status === "DONE"
                            ? colors.green
                            : tab.status === "IN_PROGRESS"
                              ? colors.amber
                              : colors.muted,
                      },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    typography.label,
                    styles.label,
                    { color: active ? colors.primary : colors.muted },
                    active && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { backgroundColor: colors.primary }, indicatorStyle]}
        />
      </View>
    </ScrollView>
  );
}

SectionTabBar.displayName = "SectionTabBar";
SectionTabBar.isStickyHeader = true;

const styles = StyleSheet.create({
  scroll: {
    marginBottom: spacing.md,
  },
  scrollContent: {
    paddingTop: 0,
  },
  row: {
    flexDirection: "row",
    position: "relative",
  },
  tab: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
  },
  labelActive: {
    fontFamily: typography.bodyMedium.fontFamily,
  },
});
