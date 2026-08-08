import { useQueryClient } from '@tanstack/react-query';
import { Children, PropsWithChildren, ReactNode, isValidElement, useCallback, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/constants/spacing';
import { ScrollIntoViewProvider } from '@/context/ScrollIntoViewContext';
import { useTheme } from '@/context/ThemeContext';
import { Reveal } from './Reveal';

type KeyboardScrollTarget = Parameters<
  InstanceType<typeof ScrollView>['scrollResponderScrollNativeHandleToKeyboard']
>[0];

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  refreshable?: boolean;
  tabBarAware?: boolean;
  stickyHeader?: boolean;
  bottomAccessory?: ReactNode;
}>;

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  contentStyle,
  refreshable = true,
  tabBarAware,
  stickyHeader = true,
  bottomAccessory,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabBarPadding = 16 + Math.max(insets.bottom, 0);
  const safeEdges = tabBarAware ? edges.filter((edge) => edge !== 'bottom') : edges;
  const contentChildren = useMemo(() => Children.toArray(children), [children]);
  // bottomAccessory renders as a real flex sibling below the content (not an overlay), so it
  // already reserves its own height. Adding footerHeight again here would double-count that
  // space. In scroll mode the extra padding is just harmless scroll-past breathing room, but in
  // the fixed (non-scroll) layout it directly shrinks the visible content area, so only the
  // tab-bar-awareness padding applies there.
  const tabBarAwarePadding = tabBarAware ? tabBarPadding : 0;
  const scrollBottomPadding = Math.max(tabBarAwarePadding, bottomAccessory ? footerHeight + spacing.lg : 0);
  const bottomPadding = scroll ? scrollBottomPadding : tabBarAwarePadding;
  const shouldStickFirstChild = stickyHeader && isHeaderLike(contentChildren[0]);
  const stickyHeaderIndices = shouldStickFirstChild ? [0] : undefined;
  const revealedChildren = useMemo(
    () =>
      contentChildren.map((child, i) =>
        shouldStickFirstChild && i === 0 ? (
          child
        ) : (
          <Reveal key={i} index={shouldStickFirstChild ? i - 1 : i} style={getChildFlexStyle(child)}>
            {child}
          </Reveal>
        ),
      ),
    [contentChildren, shouldStickFirstChild],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={safeEdges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollIntoViewProvider value={scrollIntoView}>
          {scroll ? (
            <ScrollView
              ref={scrollViewRef}
              style={styles.flex}
              contentContainerStyle={[styles.content, contentStyle, bottomPadding > 0 && { paddingBottom: bottomPadding }]}
              stickyHeaderIndices={stickyHeaderIndices}
              refreshControl={
                refreshable ? (
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
            <View style={[styles.content, styles.flex, contentStyle, bottomPadding > 0 && { paddingBottom: bottomPadding }]}>
              {revealedChildren}
            </View>
          )}
        </ScrollIntoViewProvider>
        {bottomAccessory ? <View onLayout={handleFooterLayout}>{bottomAccessory}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// A Reveal-wrapped child sits between the original element and its flex
// parent - if the child relies on `flex` to fill remaining space, or on
// `width`/`alignSelf` to stretch across the cross axis (e.g. Screen's own
// container using `alignItems: "center"` instead of the flex default
// "stretch"), the unstyled wrapper would break that sizing: `flex` only has
// effect when the immediate parent is itself sized to distribute, and a
// wrapper with no `alignItems: "stretch"` from ITS parent shrink-wraps to
// content, making a child's `width: "100%"` resolve against that near-zero
// width instead of the screen. Passing the same values through to the
// wrapper keeps the original sizing intact; children with none of these in
// their style are unaffected.
function getChildFlexStyle(child: ReactNode): StyleProp<ViewStyle> {
  if (!isValidElement(child)) return undefined;
  const style = (child.props as { style?: StyleProp<ViewStyle> } | null)?.style;
  const flattened = StyleSheet.flatten(style);
  if (!flattened) return undefined;

  const passthrough: ViewStyle = {};
  if (typeof flattened.flex === 'number') passthrough.flex = flattened.flex;
  if (flattened.width !== undefined) passthrough.width = flattened.width;
  if (flattened.alignSelf !== undefined) passthrough.alignSelf = flattened.alignSelf;

  return Object.keys(passthrough).length ? passthrough : undefined;
}

function isHeaderLike(child: ReactNode) {
  if (!isValidElement(child)) return false;

  const type = child.type as { displayName?: string; name?: string };
  const name = type.displayName ?? type.name;

  return name === 'AppHeader' || name === 'CustomerSectionHeader' || name === 'SectionTabBar' || name === 'StickyHeaderGroup';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
});



