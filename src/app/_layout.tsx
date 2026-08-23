import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { colors } from "@/constants/colors";
import { AttendanceProvider } from "@/context/AttendanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { useNotificationObserver } from "@/hooks/useNotificationObserver";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { installGlobalErrorHandlers } from "@/lib/errorReporting";
import { configureNotificationHandler } from "@/lib/pushNotifications";
import { AppQueryProvider } from "@/queries";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });
configureNotificationHandler();
installGlobalErrorHandlers();

export default function RootLayout() {
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
                      <ErrorBoundary label="root">
                        <Stack screenOptions={{ headerShown: false }} />
                      </ErrorBoundary>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
