import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";

export const PAGINATION_OVERLAY_SPACE = 64;

type PaginationOverlayProps = {
  isFetchingNextPage: boolean;
  showRetry: boolean;
  onRetry: () => void;
};

export function PaginationOverlay({
  isFetchingNextPage,
  showRetry,
  onRetry,
}: PaginationOverlayProps) {
  const { colors } = useTheme();

  if (isFetchingNextPage) {
    return (
      <View style={styles.overlay} pointerEvents="none">
        <View
          style={[
            styles.pill,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (showRetry) {
    return (
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.pill,
            styles.retryPill,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { opacity: 0.72 },
          ]}
        >
          <Text style={[typography.label, { color: colors.primary }]}>
            Couldn&apos;t load more · Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  retryPill: {
    flexDirection: "row",
  },
});
