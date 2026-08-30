import { StyleSheet, View } from "react-native";

import { Skeleton } from "@/components/ui/Skeleton";
import { spacing } from "@/constants/spacing";
import { useTheme } from "@/context/ThemeContext";

export function SectionBodySkeleton({ cards = 3 }: { cards?: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.skeletonBody}>
      {Array.from({ length: cards }, (_, index) => index).map((index) => (
        <View
          key={index}
          style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Skeleton width="55%" height={14} />
          <Skeleton width="100%" height={38} />
          <Skeleton width="82%" height={38} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBody: {
    gap: spacing.sm,
  },
  skeletonCard: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
});
