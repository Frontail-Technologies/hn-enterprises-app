import { Tabs, useSegments } from "expo-router";
import {
  CalendarDays,
  FileText,
  Home,
  IndianRupee,
  UsersRound,
} from "lucide-react-native";
import { useEffect, useRef, type ReactNode } from "react";
import {
  BackHandler,
  Platform,
  type PressableProps,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { radius } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { queryClient, queryKeys } from "@/queries";
import { customersService } from "@/services/customers.service";
import { expensesApi } from "@/services/expenses.service";

// Matches the page size each screen's own infinite-query hook uses
// (useCustomerInfiniteListQuery / useExpensesInfiniteQuery), so a tab-press
// prefetch populates the exact cache entry the real screen will read.
const PREFETCH_PAGE_SIZE = 100;

const ROOT_TABS = ["home", "attendance", "customers", "planning", "expenses"];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const authGuard = useAuthGuard();
  const { showToast } = useToast();
  const segments = useSegments();
  const lastBackPressAt = useRef(0);

  useEffect(() => {
    if (Platform.OS !== "android") return undefined;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const isRootTab =
          segments[0] === "(tabs)" && ROOT_TABS.includes(String(segments[1]));

        if (!isRootTab) return false;

        const now = Date.now();

        if (now - lastBackPressAt.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressAt.current = now;
        showToast("Press back again to exit", "subtle");
        return true;
      },
    );

    return () => subscription.remove();
  }, [segments, showToast]);

  if (authGuard.blocked) return authGuard.element;

  return (
    <Tabs
      // Traced via expo-router's own vendored bottom-tabs source
      // (react-navigation/bottom-tabs/views/BottomTabView.js): this defaults
      // to true on every platform, meaning react-native-screens detaches
      // each inactive tab's *native* screen surface and re-attaches it on
      // refocus. That surface (react-native-screens' Screen/MaybeScreen) has
      // no background of its own - our sceneStyle below only reaches an
      // *inner* JS-level wrapper one layer beneath it, never that native
      // surface - so every re-attach exposed its native default background
      // for a frame before our inner themed layers painted over it. This is
      // what the previous Screen.tsx wrapper fix could not reach, since that
      // fix operates entirely inside the JS tree, downstream of this native
      // surface. Disabling it keeps each visited tab's native view attached
      // permanently after its first mount, removing the repeated
      // detach/re-attach cycle entirely (memory cost is a handful of
      // moderate-weight screens staying resident, not video/heavy content).
      detachInactiveScreens={false}
      // Closes the one remaining gap detachInactiveScreens doesn't cover: a
      // tab's *first-ever* native creation (lazy is expo-router's own
      // default, mounting each tab only on its first visit - confirmed in
      // the same BottomTabView.js source). That first creation still shows
      // the native surface's own unset background for a frame, same
      // mechanism as above. Forcing all tabs to mount immediately means that
      // one-time creation happens while AnimatedSplash's overlay (zIndex
      // 1000) is already covering the screen, instead of later mid-session
      // when a user first taps into a not-yet-visited tab. Trade-off: every
      // tab's own initial data fetch now kicks off at launch instead of on
      // first visit - each screen already gates its own loading state
      // independently, so this doesn't block anything, just starts those
      // requests earlier.
      screenOptions={{
        headerShown: false,
        lazy: false,
        tabBarButton: TabButton,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          borderTopLeftRadius: radius.navTop,
          borderTopRightRadius: radius.navTop,
          overflow: "hidden",
          height: 74 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        // "shift" (the previous value) slides the outgoing/incoming screens
        // horizontally past each other, which is what made their edges
        // visibly meet/collide mid-transition. "fade" cross-fades instead -
        // no horizontal motion, so there's no edge to touch.
        animation: "fade",
        tabBarItemStyle: styles.tabItem,
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: {
          ...typography.caption,
          fontSize: 10,
          lineHeight: 13,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Home color={focused ? "#FFFFFF" : color} size={21} strokeWidth={focused ? 2.6 : 2} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <CalendarDays
                color={focused ? "#FFFFFF" : color}
                size={21}
                strokeWidth={focused ? 2.6 : 2}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        listeners={{
          tabPress: () => {
            void queryClient.prefetchInfiniteQuery({
              queryKey: queryKeys.customers.infiniteList(undefined),
              queryFn: ({ pageParam }) =>
                customersService.listPage({ page: pageParam as number, limit: PREFETCH_PAGE_SIZE }),
              initialPageParam: 1,
            });
          },
        }}
        options={{
          title: "Customers",
          href: "/customers",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <UsersRound
                color={focused ? "#FFFFFF" : color}
                size={21}
                strokeWidth={focused ? 2.6 : 2}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: "DPR/Planning",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <FileText
                color={focused ? "#FFFFFF" : color}
                size={21}
                strokeWidth={focused ? 2.6 : 2}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        listeners={{
          tabPress: () => {
            void queryClient.prefetchInfiniteQuery({
              queryKey: queryKeys.expenses.infiniteList({}),
              queryFn: ({ pageParam }) =>
                expensesApi.listPage({ page: pageParam as number, limit: PREFETCH_PAGE_SIZE }),
              initialPageParam: 1,
            });
          },
        }}
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <IndianRupee
                color={focused ? "#FFFFFF" : color}
                size={21}
                strokeWidth={focused ? 2.6 : 2}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}

type TabButtonProps = Pick<
  PressableProps,
  "children" | "onLongPress" | "onPress" | "accessibilityLabel" | "testID"
> & {
  accessibilityState?: {
    selected?: boolean;
  };
};

function TabButton({
  children,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityState,
  testID,
}: TabButtonProps) {
  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      android_ripple={{ color: "transparent", borderless: false }}
      onLongPress={onLongPress}
      onPress={onPress}
      // A full tab column, not a card - scaling that would read as jittery,
      // so opacity alone carries the feedback here.
      scaleTo={1}
      opacityTo={0.6}
      style={styles.tabButton}
      testID={testID}
    >
      {children}
    </AnimatedPressable>
  );
}

const TAB_ICON_TRANSITION_MS = 180;

function TabIcon({
  children,
  focused,
}: {
  children: ReactNode;
  focused?: boolean;
}) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  // Interpolates between the tab bar's own resting background (colors.card)
  // and the active pill color, rather than transparent -> color - a solid
  // endpoint blends correctly through the transition instead of an alpha
  // fade that can look washed out partway through.
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = reduceMotion
      ? focused
        ? 1
        : 0
      : withTiming(focused ? 1 : 0, { duration: TAB_ICON_TRANSITION_MS });
  }, [focused, reduceMotion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.card, colors.primary]),
  }));

  return <Animated.View style={[styles.iconPill, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  tabItem: {
    height: 58,
    paddingVertical: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  tabIcon: {
    marginTop: 0,
  },
  iconPill: {
    width: 34,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
});
