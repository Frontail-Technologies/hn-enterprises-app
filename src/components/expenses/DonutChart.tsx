import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export type DonutSegment = {
  key: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  trackColor: string;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
};

// A plain react-native-svg ring, no extra chart package - segments are drawn
// as stacked stroked circles using strokeDasharray/strokeDashoffset, which is
// the standard SVG donut technique. Rotated -90deg so the first segment
// starts at 12 o'clock, matching how the category list below it is ordered.
export function DonutChart({ segments, trackColor, size = 156, strokeWidth = 20, children }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let cumulative = 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={center} originY={center}>
          <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
          {total > 0
            ? segments
                .filter((segment) => segment.value > 0)
                .map((segment) => {
                  const length = (segment.value / total) * circumference;
                  const offset = -cumulative;
                  cumulative += length;
                  return (
                    <Circle
                      key={segment.key}
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={segment.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={offset}
                      strokeLinecap="butt"
                      fill="none"
                    />
                  );
                })
            : null}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
