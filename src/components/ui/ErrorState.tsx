import { AlertTriangle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
};

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  retryLabel = "Retry",
  compact,
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View
        style={[
          styles.iconWrap,
          compact && styles.iconWrapCompact,
          { backgroundColor: `${colors.red}1A` },
        ]}
      >
        <AlertTriangle size={compact ? 18 : 22} color={colors.red} />
      </View>
      <Text style={[typography.h2, styles.centered, { color: colors.text }]}>
        {title}
      </Text>
      <Text
        style={[typography.caption, styles.centered, { color: colors.muted }]}
      >
        {description}
      </Text>
      {onRetry ? (
        <View style={compact ? undefined : styles.action}>
          <Button
            label={retryLabel}
            variant="secondary"
            size={compact ? "compact" : undefined}
            fullWidth={!compact}
            onPress={onRetry}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  wrapCompact: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
  },
  centered: {
    textAlign: "center",
  },
  action: {
    width: 180,
  },
});
