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
              {contentChildren}
            </ScrollView>
          ) : (
            <View style={[styles.content, styles.flex, contentStyle, bottomPadding > 0 && { paddingBottom: bottomPadding }]}>
              {children}
            </View>
          )}
        </ScrollIntoViewProvider>
        {bottomAccessory ? <View onLayout={handleFooterLayout}>{bottomAccessory}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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



