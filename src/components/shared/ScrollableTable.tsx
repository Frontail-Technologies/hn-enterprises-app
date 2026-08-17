import React, { PropsWithChildren, ReactNode, useState } from "react";
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from "react-native";

type ScrollableTableProps = PropsWithChildren<{
  header: ReactNode;
  minWidth?: number;
  listMode?: boolean;
}>;

export function ScrollableTable({
  header,
  minWidth,
  listMode,
  children,
}: ScrollableTableProps) {
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
    backgroundColor: "transparent",
  },

  horizontalScrollList: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    backgroundColor: "transparent",
  },
  contentList: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
