import { ArrowRight } from 'lucide-react-native';
import { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type SectionActionCardProps = {
  title: string;
  description: string;
  meta?: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  tone?: 'orange' | 'blue';
  onPress: () => void;
};

export function SectionActionCard({ title, description, meta, icon: Icon, tone = 'orange', onPress }: SectionActionCardProps) {
  const { colors } = useTheme();
  const accent = tone === 'orange' ? colors.primary : colors.accent;
  const soft = tone === 'orange' ? colors.softOrange : colors.softBlue;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { opacity: 0.84 },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: soft }]}>
        <Icon size={20} color={accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {description}
        </Text>
        {meta ? <Text style={[typography.label, { color: accent }]}>{meta}</Text> : null}
      </View>
      <ArrowRight size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.caption,
  },
  description: {
    ...typography.label,
  },
});
