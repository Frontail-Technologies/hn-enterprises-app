import { PropsWithChildren, ReactNode, useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { ScrollIntoViewProvider } from '@/context/ScrollIntoViewContext';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type SheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
}>;

type KeyboardScrollTarget = Parameters<
  InstanceType<typeof ScrollView>['scrollResponderScrollNativeHandleToKeyboard']
>[0];

export function Sheet({ visible, onClose, title, footer, children }: SheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height);
  }, []);

  const scrollIntoView = useCallback(
    (node: unknown) => {
      if (!node) return;
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(
        node as KeyboardScrollTarget,
        footerHeight + 24,
        true,
      );
    },
    [footerHeight],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {title ? (
            <View style={styles.headerRow}>
              <Text style={[typography.h2, styles.title, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
                <X size={20} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}

          <ScrollIntoViewProvider value={scrollIntoView}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[styles.content, footer ? styles.contentWithFooter : undefined]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {footer ? (
              <View
                onLayout={handleFooterLayout}
                style={[
                  styles.footerWrap,
                  {
                    paddingBottom: Math.max(insets.bottom + spacing.sm, spacing.lg),
                    borderTopColor: colors.border,
                  },
                ]}
              >
                {footer}
              </View>
            ) : (
              <View style={{ height: insets.bottom }} />
            )}
          </ScrollIntoViewProvider>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  contentWithFooter: {
    paddingBottom: 96,
  },
  footerWrap: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
