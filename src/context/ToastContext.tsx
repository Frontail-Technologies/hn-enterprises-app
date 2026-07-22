import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { typography } from '@/constants/typography';
import { useTheme } from './ThemeContext';

type ToastTone = 'success' | 'info' | 'error' | 'subtle';

type ToastContextValue = {
  showToast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [tone, setTone] = useState<ToastTone>('success');
  const [opacity] = useState(() => new Animated.Value(0));

  const showToast = useCallback(
    (nextMessage: string, nextTone: ToastTone = 'success') => {
      setMessage(nextMessage);
      setTone(nextTone);

      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1900),
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    },
    [opacity],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const messageColor =
    tone === 'error' ? colors.red : tone === 'success' ? colors.green : colors.muted;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.toast, { opacity }]}>
        <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
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
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 96,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
  },
});
