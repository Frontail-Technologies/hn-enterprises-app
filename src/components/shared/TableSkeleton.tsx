import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { tableDividers, tableMetrics } from '@/constants/table';
import { useTheme } from '@/context/ThemeContext';

type TableSkeletonProps = {
  /** Pixel width of each column, in order - reuse the same widths as the real table. */
  columnWidths: number[];
  rowCount?: number;
  rowHeight?: number;
  headerHeight?: number;
};

export function TableSkeleton({
  columnWidths,
  rowCount = 8,
  rowHeight = tableMetrics.rowHeight,
  headerHeight = tableMetrics.headerHeight,
}: TableSkeletonProps) {
  const { colors, isDark } = useTheme();
  const dividers = tableDividers(colors, isDark);
  const lastIndex = columnWidths.length - 1;

  return (
    <View>
      <View style={[styles.headerRow, { height: headerHeight, backgroundColor: colors.surfaceMuted, borderBottomColor: dividers.header }]}>
        {columnWidths.map((width, index) => (
          <View
            key={index}
            style={[styles.cell, index < lastIndex && styles.cellDivider, { width, borderRightColor: dividers.vertical }]}
          >
            <Skeleton width="55%" height={9} />
          </View>
        ))}
      </View>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <View key={rowIndex} style={[styles.dataRow, { height: rowHeight, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {columnWidths.map((width, colIndex) => (
            <View
              key={colIndex}
              style={[styles.cell, colIndex < lastIndex && styles.cellDivider, { width, borderRightColor: dividers.vertical }]}
            >
              <Skeleton width={colIndex === 0 ? '80%' : '55%'} height={10} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: tableMetrics.cellPaddingH,
  },
  cellDivider: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});
