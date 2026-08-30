import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { controlHeight, radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { AnimatedPressable } from "./AnimatedPressable";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "compact" | "default" | "cta";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZE_HEIGHT: Record<ButtonSize, number> = {
  compact: 44,
  default: controlHeight.input,
  cta: controlHeight.cta,
};

const SIZE_PADDING_H: Record<ButtonSize, number> = {
  compact: spacing.md,
  default: spacing.xl,
  cta: spacing.xl,
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size,
  fullWidth = true,
  icon,
  disabled,
  loading,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const resolved = variant === "outline" ? "secondary" : variant;
  const isPrimary = resolved === "primary";
  const isDestructive = resolved === "destructive";
  const isSecondary = resolved === "secondary";
  const isGhost = resolved === "ghost";
  const resolvedSize: ButtonSize = size ?? (isPrimary || isDestructive ? "cta" : "default");

  const backgroundColor = isPrimary
    ? colors.primary
    : isDestructive
      ? colors.red
      : isSecondary
        ? colors.card
        : "transparent";
  const textColor = isPrimary || isDestructive ? "#FFFFFF" : isGhost ? colors.primary : colors.text;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        !fullWidth && styles.inline,
        {
          height: SIZE_HEIGHT[resolvedSize],
          paddingHorizontal: SIZE_PADDING_H[resolvedSize],
          backgroundColor,
          borderColor: isSecondary ? colors.border : "transparent",
          borderWidth: isSecondary ? 1 : 0,
        },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {/* Label stays laid out (just hidden) while loading, instead of being
          replaced by the spinner - keeps the button's own content-driven
          width stable for inline (!fullWidth) buttons instead of collapsing
          to the spinner's much smaller width. */}
      <View style={styles.contentWrap}>
        <View style={[styles.contentRow, loading && styles.hidden]}>
          {icon}
          <Text
            style={[resolvedSize === "compact" ? styles.labelCompact : styles.label, { color: textColor }]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
        {loading ? (
          <View style={styles.spinnerOverlay}>
            <ActivityIndicator color={isPrimary || isDestructive ? "#FFFFFF" : colors.primary} />
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  inline: {
    width: "auto",
    alignSelf: "flex-start",
  },
  disabled: {
    opacity: 0.5,
  },
  contentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  hidden: {
    opacity: 0,
  },
  spinnerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.button,
  },
  labelCompact: {
    ...typography.button,
    fontSize: 14,
    lineHeight: 18,
  },
});
