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
      detachInactiveScreens={false}
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
