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

import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import type { CompletionStatus } from "@/services/mockData";

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
      style={[styles.scroll, { backgroundColor: colors.surfaceMuted }]}
      contentContainerStyle={styles.scrollContent}
      onLayout={handleViewportLayout}
      onScroll={handleScroll}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollBegin={handleScrollBeginDrag}
      onMomentumScrollEnd={handleScrollEndDrag}
      scrollEventThrottle={16}
    >
      <View style={[styles.row, { borderBottomColor: colors.border }]}>
        {tabs.map((tab) => {
          const active = tab.key === activeKey;

          return (
            <Pressable
              key={tab.key}
              onPress={() => handlePress(tab.key)}
              onLayout={handleTabLayout(tab.key)}
              hitSlop={{ top: 6, bottom: 6 }}
              style={[
                styles.tab,
                active && { borderBottomColor: colors.primary },
              ]}
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
    borderBottomWidth: 1,
  },
  tab: {
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
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
