import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';

import { useTheme } from '@/context/ThemeContext';

export type StateIllustrationKind = 'empty' | 'error' | 'offline';

type StateIllustrationProps = {
  kind: StateIllustrationKind;
  size?: number;
};

export function StateIllustration({ kind, size = 64 }: StateIllustrationProps) {
  const { colors } = useTheme();
  const tint = kind === 'error' ? colors.red : kind === 'offline' ? colors.blue : colors.primary;
  const backdrop = `${tint}1A`;

  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Circle cx={28} cy={28} r={28} fill={backdrop} />

      {kind === 'empty' ? (
        <>
          {/* Empty document/tray */}
          <Rect x={14} y={18} width={24} height={20} rx={3} stroke={colors.muted} strokeWidth={2} fill={colors.card} />
          <Line x1={19} y1={25} x2={33} y2={25} stroke={colors.border} strokeWidth={2} strokeLinecap="round" />
          <Line x1={19} y1={31} x2={29} y2={31} stroke={colors.border} strokeWidth={2} strokeLinecap="round" />
          {/* Magnifying glass, searched-and-found-nothing */}
          <Circle cx={40} cy={40} r={6} stroke={tint} strokeWidth={2} fill={colors.card} />
          <Line x1={44.2} y1={44.2} x2={49} y2={49} stroke={tint} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : kind === 'offline' ? (
        <>
          {/* Signal dot + two waves */}
          <Circle cx={28} cy={32} r={3} fill={tint} />
          <Circle cx={28} cy={32} r={10} stroke={colors.border} strokeWidth={2} fill="none" />
          <Circle cx={28} cy={32} r={17} stroke={colors.border} strokeWidth={2} fill="none" />
          {/* Slash through the center (10,14)-(46,50) midpoint is exactly (28,32) */}
          <Line x1={10} y1={14} x2={46} y2={50} stroke={tint} strokeWidth={2.5} strokeLinecap="round" />
        </>
      ) : (
        <>
          {/* Warning triangle + exclamation mark */}
          <Polygon points="28,14 42,40 14,40" stroke={tint} strokeWidth={2} strokeLinejoin="round" fill={colors.card} />
          <Line x1={28} y1={22} x2={28} y2={30} stroke={tint} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={28} cy={35} r={1.6} fill={tint} />
        </>
      )}
    </Svg>
  );
}
