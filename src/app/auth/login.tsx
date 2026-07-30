import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { Check, Eye, EyeOff, Lock, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { ApiError } from "@/services/apiClient";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username, email or mobile is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetSchema = z.object({
  identifier: z.string().trim().min(1, "Username, email or mobile is required"),
});

type LoginErrors = Partial<Record<"identifier" | "password" | "form", string>>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { isAuthenticated, isLoading, login, requestPasswordReset } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Redirect href="/home" />;
  }

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setErrors({
        identifier: parsed.error.flatten().fieldErrors.identifier?.[0],
        password: parsed.error.flatten().fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await login(parsed.data);
      router.replace("/home");
    } catch (error) {
      setErrors({
        form:
          error instanceof ApiError && error.status === 0
            ? error.message
            : "Invalid username or password",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    const parsed = resetSchema.safeParse({ identifier: resetIdentifier });
    if (!parsed.success) {
      setErrors({
        identifier: parsed.error.flatten().fieldErrors.identifier?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await requestPasswordReset(parsed.data.identifier);
      showToast("Password reset request sent", "success");
      setResetMode(false);
      setResetIdentifier("");
    } catch {
      setErrors({ form: "Unable to request password reset" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      contentStyle={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={styles.logoBlock}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.tagline, { color: colors.accent }]}>
          Building Today. Securing Tomorrow.
        </Text>
      </View>

      <Card elevated style={styles.loginCard}>
        <View style={styles.cardTitle}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            {resetMode ? "Reset Password" : "Welcome Back"}
          </Text>
          <Text style={[typography.caption, { color: colors.muted }]}>
            {resetMode ? "Request a reset from admin" : "Sign in to continue"}
          </Text>
        </View>

        {resetMode ? (
          <>
            <Input
              placeholder="Username or mobile number"
              autoCapitalize="none"
              value={resetIdentifier}
              onChangeText={(value) => {
                setResetIdentifier(value);
                setErrors({});
              }}
              leftIcon={<UserRound size={18} color={colors.muted} />}
              error={errors.identifier}
            />
            {errors.form ? (
              <Text style={[styles.formError, { color: colors.red }]}>
                {errors.form}
              </Text>
            ) : null}
            <Button
              label="Request Password Reset"
              onPress={handlePasswordReset}
              loading={isSubmitting}
            />
            <Pressable
              onPress={() => setResetMode(false)}
              style={styles.backToLogin}
            >
              <Text style={[typography.caption, { color: colors.accent }]}>
                Back to sign in
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Input
              placeholder="Username / Email / Mobile"
              autoCapitalize="none"
              value={identifier}
              onChangeText={(value) => {
                setIdentifier(value);
                setErrors({});
              }}
              leftIcon={<UserRound size={18} color={colors.muted} />}
              error={errors.identifier}
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setErrors({});
              }}
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={18} color={colors.muted} />}
              rightIcon={
                showPassword ? (
                  <Eye size={17} color={colors.muted} />
                ) : (
                  <EyeOff size={17} color={colors.muted} />
                )
              }
              onRightIconPress={() => setShowPassword((value) => !value)}
              error={errors.password}
            />
            {errors.form ? (
              <Text style={[styles.formError, { color: colors.red }]}>
                {errors.form}
              </Text>
            ) : null}
            <View style={styles.formMeta}>
              <Pressable
                style={styles.remember}
                onPress={() => setRememberMe((value) => !value)}
              >
                <View
                  style={[
                    styles.checkBox,
                    {
                      borderColor: rememberMe ? colors.primary : colors.muted,
                      backgroundColor: rememberMe
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {rememberMe ? (
                    <Check size={11} color="#FFFFFF" strokeWidth={3} />
                  ) : null}
                </View>
                <Text style={[typography.caption, { color: colors.text }]}>
                  Remember me
                </Text>
              </Pressable>
              <Pressable onPress={() => setResetMode(true)}>
                <Text style={[typography.caption, { color: colors.accent }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>
            <Button label="Sign In" onPress={handleLogin} loading={isSubmitting} />
          </>
        )}
        <Text style={[styles.supportText, { color: colors.muted }]}>
          Need help?{" "}
          <Text style={{ color: colors.accent }}>Contact Support</Text>
        </Text>
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
    width: 170,
    height: 112,
  },

  tagline: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  loginCard: {
    width: "100%",
    marginTop: spacing.xl,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.sm,
  },
  cardTitle: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  welcomeTitle: {
    ...typography.h2,
    fontSize: 18,
    lineHeight: 24,
  },
  formMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  formError: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  remember: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkBox: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.4,
    borderRadius: radius.sm,
  },
  backToLogin: {
    alignItems: "center",
    paddingVertical: spacing.xs,
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
