import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ForgotPasswordFlow } from "@/components/auth/ForgotPasswordFlow";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [resetMode, setResetMode] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <Screen scroll refreshable={false} contentStyle={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.logoBlock}>
        <Image
          source={isDark ? require("@/assets/images/logo-dark.png") : require("@/assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <Card elevated style={styles.loginCard}>
        {resetMode ? (
          <ForgotPasswordFlow onBack={() => setResetMode(false)} />
        ) : (
          <>
            <LoginForm onForgotPassword={() => setResetMode(true)} />
            <Text style={[styles.supportText, { color: colors.muted }]}>
              Need help? <Text style={{ color: colors.accent }}>Contact Support</Text>
            </Text>
          </>
        )}
      </Card>

      <Text style={[styles.version, { color: colors.muted }]}>v 1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoBlock: {
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 120,
  },
  loginCard: {
    width: "100%",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
  },
  supportText: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  version: {
    ...typography.label,
    textAlign: "center",
  },
});
