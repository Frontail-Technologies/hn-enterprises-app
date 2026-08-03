import { Eye, EyeOff, Lock, ShieldCheck, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";

const resetRequestSchema = z.object({
  identifier: z.string().trim().min(1, "Username, email or mobile is required"),
});

const resetCompleteSchema = z
  .object({
    identifier: z.string().trim().min(1, "Username, email or mobile is required"),
    otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6 digit OTP"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type ResetErrors = Partial<
  Record<"identifier" | "otp" | "newPassword" | "confirmPassword" | "form", string>
>;

export function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [errors, setErrors] = useState<ResetErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestOtp = async () => {
    const parsed = resetRequestSchema.safeParse({ identifier: resetIdentifier });
    if (!parsed.success) {
      setErrors({
        identifier: parsed.error.flatten().fieldErrors.identifier?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await requestPasswordReset(parsed.data.identifier);
      setDevOtp(result.resetOtp ?? null);
      setResetOtpSent(true);
      showToast("OTP sent if the account exists", "success");
    } catch {
      setErrors({ form: "Unable to request password reset" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReset = async () => {
    const parsed = resetCompleteSchema.safeParse({
      identifier: resetIdentifier,
      otp,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        identifier: fieldErrors.identifier?.[0],
        otp: fieldErrors.otp?.[0],
        newPassword: fieldErrors.newPassword?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await resetPassword({
        identifier: parsed.data.identifier,
        otp: parsed.data.otp,
        newPassword: parsed.data.newPassword,
      });
      showToast("Password reset successfully", "success");
      onBack();
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Password reset failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.cardTitle}>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Reset Password</Text>
        <Text style={[typography.caption, { color: colors.muted }]}>
          {resetOtpSent ? "Enter OTP and set a new password" : "Request OTP on registered email"}
        </Text>
      </View>

      <Input
        placeholder="Username / Email / Mobile"
        autoCapitalize="none"
        value={resetIdentifier}
        editable={!resetOtpSent}
        onChangeText={(value) => {
          setResetIdentifier(value);
          setErrors({});
        }}
        leftIcon={<UserRound size={18} color={colors.muted} />}
        error={errors.identifier}
      />

      {resetOtpSent ? (
        <>
          <Input
            placeholder="6 digit OTP"
            keyboardType="number-pad"
            value={otp}
            onChangeText={(value) => {
              setOtp(value.replace(/\D/g, "").slice(0, 6));
              setErrors({});
            }}
            leftIcon={<ShieldCheck size={18} color={colors.muted} />}
            error={errors.otp}
          />
          <Input
            placeholder="New password"
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              setErrors({});
            }}
            secureTextEntry={!showNewPassword}
            leftIcon={<Lock size={18} color={colors.muted} />}
            rightIcon={
              showNewPassword ? (
                <Eye size={17} color={colors.muted} />
              ) : (
                <EyeOff size={17} color={colors.muted} />
              )
            }
            onRightIconPress={() => setShowNewPassword((value) => !value)}
            error={errors.newPassword}
          />
          <Input
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setErrors({});
            }}
            secureTextEntry={!showConfirmPassword}
            leftIcon={<Lock size={18} color={colors.muted} />}
            rightIcon={
              showConfirmPassword ? (
                <Eye size={17} color={colors.muted} />
              ) : (
                <EyeOff size={17} color={colors.muted} />
              )
            }
            onRightIconPress={() => setShowConfirmPassword((value) => !value)}
            error={errors.confirmPassword}
          />
          {devOtp ? (
            <Text style={[styles.devOtp, { color: colors.muted }]}>Development OTP: {devOtp}</Text>
          ) : null}
        </>
      ) : null}

      {errors.form ? (
        <Text style={[styles.formError, { color: colors.red }]}>{errors.form}</Text>
      ) : null}
      <Button
        label={resetOtpSent ? "Reset Password" : "Request OTP"}
        onPress={resetOtpSent ? handleCompleteReset : handleRequestOtp}
        loading={isSubmitting}
      />
      <Pressable onPress={onBack} style={styles.backToLogin}>
        <Text style={[typography.caption, { color: colors.accent }]}>Back to sign in</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
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
  formError: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
  },
  devOtp: {
    ...typography.caption,
    textAlign: "center",
  },
  backToLogin: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
});
