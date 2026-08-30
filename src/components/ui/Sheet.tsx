import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Easing } from "react-native-reanimated";
import { X } from "lucide-react-native";

import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import { addActionBreadcrumb } from "@/lib/sentry";

type SheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  snapPoints?: (string | number)[];
  sentryName?: string;
}>;

export function Sheet({
  visible,
  onClose,
  title,
  description,
  footer,
  snapPoints,
  sentryName,
  children,
}: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet, isLargeTablet } = useResponsive();
  const sheetMaxWidth = isLargeTablet ? 640 : isTablet ? 600 : undefined;
  const sheetRef = useRef<BottomSheetModal>(null);
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.out(Easing.cubic),
  });
  const wasPresentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      if (!wasPresentedRef.current) {
        sheetRef.current?.present();
        wasPresentedRef.current = true;
        addActionBreadcrumb("sheet", "opened", { name: sentryName ?? "unnamed" });
      }
      return;
    }

    if (wasPresentedRef.current) {
      sheetRef.current?.dismiss();
    }
  }, [visible, sentryName]);

  const handleDismiss = useCallback(() => {
    wasPresentedRef.current = false;
    addActionBreadcrumb("sheet", "dismissed", { name: sentryName ?? "unnamed" });
    onClose();
  }, [onClose, sentryName]);

  const [footerHeight, setFooterHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== "android" || !visible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        sheetRef.current?.dismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) =>
      footer ? (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            onLayout={(event) =>
              setFooterHeight(event.nativeEvent.layout.height)
            }
            style={[
              styles.footerWrap,
              {
                paddingBottom:
                  insets.bottom > 0 ? insets.bottom + spacing.sm : spacing.lg,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          >
            {footer}
          </View>
        </BottomSheetFooter>
      ) : null,
    [footer, insets.bottom, colors.border, colors.surface],
  );

  const renderHandle = useCallback(
    () => (
      <View
        style={[styles.handleContainer, { backgroundColor: colors.surface }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        {title ? (
          <>
            <View style={styles.headerRow}>
              <Text
                style={[typography.h2, styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={10}
                style={styles.closeButton}
              >
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>
            {description ? (
              <Text
                style={[
                  typography.label,
                  styles.description,
                  { color: colors.muted },
                ]}
              >
                {description}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    ),
    [colors, title, description, onClose],
  );

  const sheetStyle = useMemo(
    () =>
      sheetMaxWidth
        ? [
            {
              maxWidth: sheetMaxWidth,
              width: "100%" as const,
              alignSelf: "center" as const,
            },
          ]
        : undefined,
    [sheetMaxWidth],
  );

  const enableDynamicSizing = !snapPoints;

  return (
    <BottomSheetModal
      ref={sheetRef}
      onDismiss={handleDismiss}
      topInset={insets.top}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose
      snapPoints={snapPoints}
      index={0}
      stackBehavior="push"
      animationConfigs={animationConfigs}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      footerComponent={renderFooter}
      backgroundStyle={[
        styles.background,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      style={sheetStyle}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: footer
              ? footerHeight + spacing.lg
              : Math.max(insets.bottom, spacing.lg),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  handleContainer: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  description: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  footerWrap: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
