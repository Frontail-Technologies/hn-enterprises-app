import React, { PropsWithChildren, ReactNode, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';

type ScrollableTableProps = PropsWithChildren<{
  header: ReactNode;
  minWidth?: number;
  // Default mode sizes to content and relies on an ancestor ScrollView for
  // vertical scrolling (fine for small, fixed row counts). Virtualized rows
  // (a FlashList as `children`) need a bounded height to size against
  // instead - listMode makes both the horizontal ScrollView and its content
  // wrapper flex:1 so that bound reaches the child list.
  listMode?: boolean;
}>;

export function ScrollableTable({ header, minWidth, listMode, children }: ScrollableTableProps) {
  // Narrow tables (few/short columns) would otherwise size to their own
  // content and leave blank space beside them - stretch to at least the
  // visible container width so rows always span the full screen.
  const [containerWidth, setContainerWidth] = useState(0);
  const contentMinWidth = Math.max(minWidth ?? 0, containerWidth);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={listMode ? styles.horizontalScrollList : styles.horizontalScroll}
      nestedScrollEnabled
      onLayout={handleLayout}
    >
      <View
        style={[
          listMode ? styles.contentList : styles.content,
          contentMinWidth ? { minWidth: contentMinWidth } : undefined,
        ]}
      >
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
  // listMode needs the ScrollView (and its content wrapper below) to grow
  // and fill an ancestor's remaining space, so a virtualized child (e.g. a
  // FlashList) has a bounded height to size against. This has to be a
  // wholly separate style object from the default, non-listMode one above -
  // `flex` and `flexGrow` are distinct Yoga properties, so layering
  // `{ flex: 1 }` on top of the default's explicit `flexGrow: 0` in a style
  // array does NOT cleanly override it the way later keys normally would.
  horizontalScrollList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: 'transparent',
  },
  contentList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
