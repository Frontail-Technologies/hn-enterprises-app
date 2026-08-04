import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { spacing } from '@/constants/spacing';
import { useTheme } from '@/context/ThemeContext';

type TableSkeletonProps = {
  /** Pixel width of each column, in order - reuse the same widths as the real table. */
  columnWidths: number[];
  rowCount?: number;
  rowHeight?: number;
  headerHeight?: number;
};

export function TableSkeleton({ columnWidths, rowCount = 8, rowHeight = 36, headerHeight = 28 }: TableSkeletonProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { borderColor: colors.border }]}>
      <View style={[styles.row, { height: headerHeight, backgroundColor: colors.softOrange, borderColor: colors.border }]}>
        {columnWidths.map((width, index) => (
          <View key={index} style={[styles.cell, { width, borderColor: colors.border }]}>
            <Skeleton width="60%" height={9} />
          </View>
        ))}
      </View>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { height: rowHeight, backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
          {columnWidths.map((width, colIndex) => (
            <View key={colIndex} style={[styles.cell, { width, borderColor: colors.border }]}>
              <Skeleton width={colIndex === 0 ? '85%' : '55%'} height={11} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  cell: {
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
    paddingHorizontal: spacing.sm,
  },
});
