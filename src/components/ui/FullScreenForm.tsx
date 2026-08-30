import { ReactNode, forwardRef, useImperativeHandle, useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';

export type FullScreenFormHandle = {
  scrollTo: (y: number) => void;
};

type FullScreenFormProps = {
  title: string;
  onBack: () => void;
  footer?: ReactNode;
  children: ReactNode;
};

export const FullScreenForm = forwardRef<FullScreenFormHandle, FullScreenFormProps>(function FullScreenForm(
  { title, onBack, footer, children },
  ref,
) {
  const { colors } = useTheme();
  const { formMaxWidth } = useResponsive();
  const scrollRef = useRef<ScrollView>(null);
  const constraint = formMaxWidth ? { maxWidth: formMaxWidth } : undefined;

  useImperativeHandle(
    ref,
    () => ({
      scrollTo: (y: number) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true }),
    }),
    [],
  );

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: colors.background }]}>
      <AppHeader
        title={title}
        style={styles.header}
        left={
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.inner, constraint]}>{children}</View>
        </ScrollView>
        {footer ? (
          <View style={styles.footerHost}>
            <View style={[styles.footerConstraint, constraint]}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    marginBottom: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  inner: {
    width: '100%',
    paddingHorizontal: 20,
    gap: spacing.md,
  },
  footerHost: {
    alignItems: 'center',
  },
  footerConstraint: {
    width: '100%',
  },
});
