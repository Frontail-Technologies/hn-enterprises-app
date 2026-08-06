import React, { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type ScrollableTableProps = PropsWithChildren<{
  header: ReactNode;
  minWidth?: number;
}>;

export function ScrollableTable({ header, minWidth, children }: ScrollableTableProps) {
  const { colors } = useTheme();
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.horizontalScroll}
      nestedScrollEnabled
    >
      <View style={[styles.content, minWidth ? { minWidth } : undefined]}>
        {header}
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  horizontalScroll: {
    flexGrow: 0,
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: 'transparent',
  },
});
