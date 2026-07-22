import { CheckCircle2, CloudOff, Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type FormStateBannerProps = {
  state?: 'loaded' | 'saved' | 'submitted' | 'offline' | 'error' | 'idle';
};

export function FormStateBanner({ state = 'idle' }: FormStateBannerProps) {
  const { colors } = useTheme();

  if (state === 'idle') return null;

  const copy =
    state === 'loaded'
      ? 'Draft restored on this device.'
      : state === 'saved'
        ? 'Draft saved locally.'
        : state === 'submitted'
          ? 'Submitted locally. Sync is mocked for now.'
          : state === 'offline'
            ? 'Offline mode: changes will stay on this device.'
            : 'Please review highlighted fields.';
  const Icon = state === 'offline' ? CloudOff : state === 'error' ? Info : CheckCircle2;
  const color = state === 'error' ? colors.red : state === 'offline' ? colors.muted : colors.green;

  return (
    <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon size={17} color={color} />
      <Text style={[styles.copy, { color: colors.text }]}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  copy: {
    ...typography.label,
    flex: 1,
  },
});
