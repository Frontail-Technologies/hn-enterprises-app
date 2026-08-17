import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

type SectionCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, action, children }: SectionCardProps) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {action}
      </View>
      <View style={styles.body}>{children}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    lineHeight: 21,
  },
  body: {
    marginTop: spacing.sm,
  },
});
