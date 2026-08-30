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
// Module scope, not inside a component - runs before React ever renders, so a crash during the
// very first render is still captured.
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

// Wraps the root component with Sentry's Expo Router integration (automatic native-crash/
// gesture instrumentation) - the recommended integration point. This wraps only the outermost
// export; it does not change the provider tree, ErrorBoundary, or splash/bootstrap logic above.
export default Sentry.wrap(RootLayout);

// Default status bar style, theme-aware - individual screens (e.g. AppHeader, which is always
// dark-toned in both themes by design, or login.tsx) can still mount their own StatusBar to
// override this while they're focused; expo-status-bar resolves to whichever is currently
// mounted. Without this, a screen with neither would fall back to whatever the OS/last-mounted
// StatusBar happened to leave behind instead of following the resolved theme.
function ThemedStatusBar() {
  const { isDark } = useTheme();

  return <StatusBar style={isDark ? "light" : "dark"} />;
}

// GestureHandlerRootView sits below everything RN renders - the native window/root-view surface
// beneath even that (what a gesture-driven screen transition or edge-of-screen reveal briefly
// exposes) is a separate native layer that otherwise just stays whatever color it was last left
// at. Without this, switching to dark theme (or a system-driven switch, since HN now follows the
// OS) left that native surface on its original light color, showing as a light flash during those
// transitions.
function ThemedRootBackground() {
  const { colors } = useTheme();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  return null;
}

// A real, always-correct themed layer at the RN paint level, directly behind the Stack -
// GestureHandlerRootView's own `style` (below) is a plain flex:1 View with no background of its
// own, so without this, any gap in coverage (a screen transition frame, the moment before a
// route's own themed container has mounted) would fall through to whatever the native window
// happens to be - normally the correctly-themed color ThemedRootBackground sets, but not
// guaranteed the instant theme changes (that call is async and can silently fail; see its
// `.catch`). This View re-renders synchronously with every theme change, no native bridge involved,
// so it's the actual backstop, not a redundant duplicate of ThemedRootBackground.
function ThemedRootFill() {
  const { colors } = useTheme();

  return <View style={[styles.fill, { backgroundColor: colors.background }]} />;
}

// Route-shape breadcrumbs only ("/customers/:id", never the real id) - see addRouteBreadcrumb.
function RouteBreadcrumbs() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) addRouteBreadcrumb(pathname);
  }, [pathname]);

  return null;
}

// Boot-time observers only - NOT an auth guard. Route-level auth ownership
// lives declaratively where each route actually needs it (index redirect,
// login redirect, each protected route group's own layout, and the
// standalone screens that guard themselves).
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

// contentStyle is what React Navigation's native-stack actually paints as each screen's own
// background during a push/pop transition - left unset, it defaults to white regardless of app
// theme, which is what showed through as a flash on every push/back navigation. Every nested
// route group's own Stack (ProtectedStack, shared by attendance/customers/expenses/planning/
// stats/work) needs this same fix - see ProtectedStack.tsx.
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
