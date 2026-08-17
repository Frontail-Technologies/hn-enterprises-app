import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from './ThemeContext';

type ToastTone = 'success' | 'error' | 'warning' | 'info' | 'subtle';

type ToastItem = { id: string; message: string; tone: ToastTone };

type ToastState = { current: ToastItem | null; queue: ToastItem[] };

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ToastState>({ current: null, queue: [] });
  const [opacity] = useState(() => new Animated.Value(0));

  const showToast = useCallback((message: string, tone: ToastTone = 'success') => {
    const item: ToastItem = { id: `${Date.now()}-${Math.random()}`, message, tone };
    setState((prev) =>
      prev.current ? { ...prev, queue: [...prev.queue, item] } : { current: item, queue: prev.queue },
    );
  }, []);

  const advance = useCallback(() => {
    setState((prev) =>
      prev.queue.length ? { current: prev.queue[0], queue: prev.queue.slice(1) } : { current: null, queue: [] },
    );
  }, []);

  const current = state.current;

  useEffect(() => {
    if (!current) return;

    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1900),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => {
      if (finished) advance();
    });

    return () => animation.stop();
  }, [current, opacity, advance]);

  const value = useMemo(() => ({ showToast }), [showToast]);
  const tone = current?.tone ?? 'info';
  const toneColor =
    tone === 'success'
      ? colors.green
      : tone === 'error'
        ? colors.red
        : tone === 'warning'
          ? colors.amber
          : tone === 'info'
            ? colors.blue
            : colors.muted;
  const Icon =
    tone === 'success' ? CheckCircle2 : tone === 'error' ? XCircle : tone === 'warning' ? AlertTriangle : Info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.container, { opacity, bottom: insets.bottom + 84 }]}>
        {current ? (
          <View
            style={[
              styles.toast,
              { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: toneColor },
            ]}
          >
            <Icon size={18} color={toneColor} />
            <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
              {current.message}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return value;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    zIndex: 50,
  },
  toast: {
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    ...typography.caption,
    flexShrink: 1,
  },
});
