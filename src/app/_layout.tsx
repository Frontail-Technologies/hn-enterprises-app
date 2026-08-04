import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AttendanceProvider } from '@/context/AttendanceContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { AppQueryProvider } from '@/queries';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <AppQueryProvider>
            <AuthProvider>
              <NotificationsProvider>
                <AttendanceProvider>
                  <AuthRedirector />
                  <ThemedStatusBar />
                  <Stack screenOptions={{ headerShown: false }} />
                  <AuthLoadingOverlay />
                </AttendanceProvider>
              </NotificationsProvider>
            </AuthProvider>
          </AppQueryProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function AuthRedirector() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  usePushRegistration(isAuthenticated);

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = segments[0] === 'auth';
    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && isAuthRoute) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  return null;
}

// Covers the Stack while the stored session is being verified on launch, so
// nothing (e.g. the login screen, mid-request) renders and gets torn down by
// the redirect that follows a moment later.
function AuthLoadingOverlay() {
  const { isLoading } = useAuth();
  const { colors } = useTheme();

  if (!isLoading) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
