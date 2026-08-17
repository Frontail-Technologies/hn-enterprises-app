import { Children, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';

export function FormRow({ children }: { children: ReactNode }) {
  const { isTablet } = useResponsive();
  const items = Children.toArray(children);

  return (
    <View style={[styles.base, isTablet ? styles.row : styles.column]}>
      {items.map((child, index) => (
        <View key={index} style={isTablet ? styles.col : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flexDirection: 'column',
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
});
