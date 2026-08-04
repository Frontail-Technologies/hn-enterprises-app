import { Image } from "expo-image";
import { Redirect } from "expo-router";
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
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [resetMode, setResetMode] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return (
    <Screen contentStyle={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.logoBlock}>
        <Image
          source={require("@/assets/images/logo.png")}
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
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.xxl,
    paddingHorizontal: 20,
  },
  logoBlock: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    zIndex: 2,
  },
  logo: {
    width: 240,
    height: 146,
  },
  loginCard: {
    width: "100%",
    marginTop: spacing.lg,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  supportText: {
    ...typography.caption,
    marginTop: spacing.md,
    textAlign: "center",
  },
  version: {
    position: "absolute",
    bottom: 18,
    ...typography.label,
  },
});
