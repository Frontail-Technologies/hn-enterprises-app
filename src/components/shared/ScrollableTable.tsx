import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

type ScrollableTableProps = PropsWithChildren<{
  header: ReactNode;
  minWidth?: number;
}>;

export function ScrollableTable({ header, minWidth, children }: ScrollableTableProps) {
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    backgroundColor: '#FFFFFF',
  },
});
