import {
  Children,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";

import { pagePadding, spacing } from "@/constants/spacing";
import { ScrollIntoViewProvider } from "@/context/ScrollIntoViewContext";
import { useTheme } from "@/context/ThemeContext";
import { useAppHeaderBackground } from "@/hooks/useAppHeaderBackground";
import { Reveal, getChildFlexStyle } from "./Reveal";
import { StickyHeaderGroup } from "./StickyHeaderGroup";

type KeyboardScrollTarget = Parameters<
  InstanceType<typeof ScrollView>["scrollResponderScrollNativeHandleToKeyboard"]
>[0];

type ContentInset = "page" | "compact" | "none";

const CONTENT_INSET: Record<ContentInset, number> = {
  page: pagePadding,
  compact: 8,
  none: 0,
};

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  contentInset?: ContentInset;
  refreshable?: boolean;
  onRefresh?: () => void | Promise<void>;
  tabBarAware?: boolean;
  stickyHeader?: boolean;
  bottomAccessory?: ReactNode;
  revealContent?: boolean;
}>;

export function Screen({
  children,
  scroll = false,
  edges = ["top", "bottom"],
  contentStyle,
  contentInset = "compact",
  refreshable = true,
  onRefresh,
  tabBarAware,
  stickyHeader = true,
  bottomAccessory,
  revealContent = true,
}: ScreenProps) {
  const { colors } = useTheme();
  const headerBackground = useAppHeaderBackground();
  const [refreshing, setRefreshing] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabBarAwarePadding = tabBarAware ? spacing.lg : 0;
  const horizontalInset = CONTENT_INSET[contentInset];

  const contentChildren = useMemo(() => Children.toArray(children), [children]);
  const shouldStickFirstChild =
    stickyHeader && isHeaderLike(contentChildren[0]);
  const headerChild = shouldStickFirstChild ? contentChildren[0] : null;
  const bodyChildren = shouldStickFirstChild
    ? contentChildren.slice(1)
    : contentChildren;

  const groupedHeaderChildren =
    headerChild && isValidElement(headerChild) && headerChild.type === StickyHeaderGroup
      ? Children.toArray((headerChild as ReactElement<PropsWithChildren>).props.children)
      : null;
  const boxedHeaderChild = groupedHeaderChildren ? groupedHeaderChildren[0] : headerChild;
  const unboxedHeaderChildren = groupedHeaderChildren ? groupedHeaderChildren.slice(1) : null;

  const safeEdges = edges.filter((edge) => {
    if (tabBarAware && edge === "bottom") return false;
    if (shouldStickFirstChild && edge === "top") return false;
    return true;
  });

  const scrollBottomPadding = Math.max(
    tabBarAwarePadding,
    bottomAccessory ? footerHeight + spacing.lg : 0,
  );
  const bottomPadding = scroll ? scrollBottomPadding : tabBarAwarePadding;

  const revealedChildren = useMemo(
    () =>
      revealContent
        ? bodyChildren.map((child, i) => (
            <Reveal key={i} index={i} style={getChildFlexStyle(child)}>
              {child}
            </Reveal>
          ))
        : bodyChildren,
    [bodyChildren, revealContent],
  );

  const canRefresh = refreshable && Boolean(onRefresh);
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height);
  }, []);

  const scrollIntoView = useCallback(
    (node: unknown) => {
      if (!node) return;
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        node as KeyboardScrollTarget,
        footerHeight + 24,
        true,
      );
    },
    [footerHeight],
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={safeEdges}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {headerChild ? (
          <>
            {/* Same resolved color AppHeader itself paints (see
              useAppHeaderBackground) - previously this wrapper had no
              background of its own at all, so the instant between a fresh
              screen mounting and AppHeader's own View actually painting could
              expose a default/unrendered layer instead of the correct brand
              color. This box hugs only AppHeader's own bounds (not a whole
              StickyHeaderGroup - see groupedHeaderChildren above), so there's
              no left-over margin here that would get repainted with the
              header's color instead of the screen's base background. */}
            <View style={{ backgroundColor: headerBackground }}>{boxedHeaderChild}</View>
            {unboxedHeaderChildren}
          </>
        ) : null}
        <ScrollIntoViewProvider value={scrollIntoView}>
          {scroll ? (
            <ScrollView
              ref={scrollViewRef}
              style={styles.flex}
              contentContainerStyle={[
                styles.growContent,
                { paddingHorizontal: horizontalInset },
                shouldStickFirstChild && styles.headerGap,
                contentStyle,
                bottomPadding > 0 && { paddingBottom: bottomPadding },
              ]}
              refreshControl={
                canRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primaryDark}
                    colors={[colors.primaryDark]}
                    progressBackgroundColor={colors.card}
                  />
                ) : undefined
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {revealedChildren}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.flex,
                { paddingHorizontal: horizontalInset },
                shouldStickFirstChild && styles.headerGap,
                contentStyle,
                bottomPadding > 0 && { paddingBottom: bottomPadding },
              ]}
            >
              {revealedChildren}
            </View>
          )}
        </ScrollIntoViewProvider>
        {bottomAccessory ? (
          <View onLayout={handleFooterLayout}>{bottomAccessory}</View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isHeaderLike(child: ReactNode) {
  if (!isValidElement(child)) return false;
  const type = child.type as { isStickyHeader?: boolean } | null;
  return type?.isStickyHeader === true;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerGap: {
    paddingTop: spacing.md,
  },
  growContent: {
    flexGrow: 1,
  },
});
