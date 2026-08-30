import { StyleSheet, Text, View } from "react-native";

import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./Button";
import { StateIllustration } from "./StateIllustration";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  // See EmptyState's `fill` - same fix, same reason: without flex: 1 this
  // centers within a View that's already exactly its own content's size,
  // which does nothing visually when used as a list's ListEmptyComponent.
  fill?: boolean;
  // Swaps the illustration/default copy for the no-internet variant - opt-in
  // for call sites that already know the failure is a connectivity issue,
  // rather than guessing from the error object.
  offline?: boolean;
};

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Retry",
  compact,
  fill,
  offline,
}: ErrorStateProps) {
  const { colors } = useTheme();
  const resolvedTitle = title ?? (offline ? "You're offline" : "Something went wrong");
  const resolvedDescription =
    description ?? (offline ? "Check your internet connection and try again." : "Please try again in a moment.");

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, fill && styles.wrapFill]}>
      <View style={[styles.message, compact && styles.messageCompact]}>
        <StateIllustration kind={offline ? "offline" : "error"} size={compact ? 48 : 64} />
        <Text style={[typography.bodyMedium, styles.centered, { color: colors.text }]}>
          {resolvedTitle}
        </Text>
        <Text
          style={[typography.caption, styles.centered, { color: colors.muted }]}
        >
          {resolvedDescription}
        </Text>
      </View>
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
  wrapFill: {
    flex: 1,
  },
  // Dims the icon/title/description block only, not the Retry button -
  // matches EmptyState's `message`/`messageCompact`.
  message: {
    alignItems: "center",
    gap: spacing.md,
    opacity: 0.6,
  },
  messageCompact: {
    gap: spacing.sm,
  },
  centered: {
    textAlign: "center",
  },
  action: {
    width: 180,
  },
});
