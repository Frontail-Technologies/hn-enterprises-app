import { router } from "expo-router";
import { Check, Eye, EyeOff, Lock, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ApiError } from "@/services/apiClient";

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Username, email or mobile is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginErrors = Partial<Record<"identifier" | "password" | "form", string>>;

export function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        identifier: fieldErrors.identifier?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await login(parsed.data, rememberMe);
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

  return (
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
        <Text style={[styles.formError, { color: colors.red }]}>{errors.form}</Text>
      ) : null}
      <View style={styles.formMeta}>
        <Pressable style={styles.remember} onPress={() => setRememberMe((value) => !value)}>
          <View
            style={[
              styles.checkBox,
              {
                borderColor: rememberMe ? colors.primary : colors.muted,
                backgroundColor: rememberMe ? colors.primary : "transparent",
              },
            ]}
          >
            {rememberMe ? <Check size={11} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text style={[typography.caption, { color: colors.text }]}>Remember me</Text>
        </Pressable>
        <Pressable onPress={onForgotPassword}>
          <Text style={[typography.caption, { color: colors.accent }]}>Forgot password?</Text>
        </Pressable>
      </View>
      <Button label="Sign In" onPress={handleLogin} loading={isSubmitting} />
    </>
  );
}

const styles = StyleSheet.create({
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
});
