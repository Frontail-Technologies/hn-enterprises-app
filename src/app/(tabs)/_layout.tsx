import { Redirect, Tabs, router, useSegments } from "expo-router";
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
  Pressable,
  type PressableProps,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";

const ROOT_TABS = ["home", "attendance", "customers", "planning", "expenses"];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
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

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: TabButton,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 74 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
          overflow: "visible",
        },
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
              <Home color={color} size={21} strokeWidth={focused ? 2.6 : 2} />
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
                color={color}
                size={21}
                strokeWidth={focused ? 2.6 : 2}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "",
          tabBarLabel: "",
          href: "/customers",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} center>
              <UsersRound color="#FFFFFF" size={24} strokeWidth={2.8} />
            </TabIcon>
          ),
        }}
        listeners={{
          tabPress: () => {
            router.setParams({ reset: String(Date.now()) });
          },
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: "DPR/Planning",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <FileText
                color={color}
                size={21}
                strokeWidth={focused ? 2.6 : 2}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <IndianRupee
                color={color}
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
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      android_ripple={{ color: "transparent", borderless: false }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabButton,
        pressed && styles.tabButtonPressed,
      ]}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

function TabIcon({
  focused,
  center,
  children,
}: {
  focused: boolean;
  center?: boolean;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.iconPill,
        center && {
          ...styles.centerIcon,
          backgroundColor: colors.primary,
          borderColor: colors.card,
        },
        focused &&
          !center && {
            backgroundColor: "transparent",
          },
      ]}
    >
      {children}
    </View>
  );
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
  tabButtonPressed: {
    opacity: 0.72,
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
  centerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    transform: [{ translateY: -8 }],
  },
});
