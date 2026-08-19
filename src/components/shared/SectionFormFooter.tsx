import { router } from "expo-router";
import { Upload } from "lucide-react-native";
import { View, StyleSheet } from "react-native";

import { StickyFooter } from "@/components/shared/StickyFooter";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/constants/spacing";

type SectionFormFooterProps = {
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  // Optional - most sections don't have a cheap enough dirty check to pass
  // this yet (see useDraftForm's isDirty), so it defaults to enabled.
  disabled?: boolean;
};

export function SectionFormFooter({
  onSubmit,
  submitLabel = "Submit",
  isSubmitting = false,
  disabled = false,
}: SectionFormFooterProps) {
  return (
    <StickyFooter>
      <View style={styles.row}>
        <View style={styles.secondary}>
          <Button
            label="Back"
            variant="outline"
            onPress={() => router.back()}
            disabled={isSubmitting}
          />
        </View>
        <View style={styles.primary}>
          <Button
            label={submitLabel}
            icon={<Upload size={18} color="#FFFFFF" />}
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={disabled}
          />
        </View>
      </View>
    </StickyFooter>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondary: {
    flex: 0.9,
  },
  primary: {
    flex: 1.1,
  },
});
