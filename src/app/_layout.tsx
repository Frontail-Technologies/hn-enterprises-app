import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import * as Sentry from "@sentry/react-native";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AnimatedSplash } from "@/components/shared/AnimatedSplash";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AttendanceProvider } from "@/context/AttendanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { useNotificationObserver } from "@/hooks/useNotificationObserver";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { installGlobalErrorHandlers } from "@/lib/errorReporting";
import { configureNotificationHandler } from "@/lib/pushNotifications";
import { addRouteBreadcrumb, initSentry } from "@/lib/sentry";
import { AppQueryProvider } from "@/queries";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });
configureNotificationHandler();
installGlobalErrorHandlers();
initSentry();

function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppQueryProvider>
              <AuthProvider>
                <NotificationsProvider>
                  <AttendanceProvider>
                    <BottomSheetModalProvider>
                      <SplashGate />
                      <AppBootObservers />
                      <RouteBreadcrumbs />
                      <ThemedStatusBar />
                      <ThemedRootBackground />
                      <ThemedRootFill />
                      <ErrorBoundary label="root">
                        <ThemedStack />
                      </ErrorBoundary>
                      <AnimatedSplash />
                    </BottomSheetModalProvider>
                  </AttendanceProvider>
                </NotificationsProvider>
              </AuthProvider>
            </AppQueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);

function ThemedStatusBar() {
  const { isDark } = useTheme();

  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function ThemedRootBackground() {
  const { colors } = useTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  return null;
}

function ThemedRootFill() {
  const { colors } = useTheme();

  return <View style={[styles.fill, { backgroundColor: colors.background }]} />;
}

function RouteBreadcrumbs() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) addRouteBreadcrumb(pathname);
  }, [pathname]);

  return null;
}

function AppBootObservers() {
  const { isAuthenticated } = useAuth();

  usePushRegistration(isAuthenticated);
  useNotificationObserver();

  return null;
}

function SplashGate() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}

function ThemedStack() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
