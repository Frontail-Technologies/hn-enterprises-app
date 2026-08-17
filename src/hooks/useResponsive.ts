import { useWindowDimensions } from 'react-native';

const TABLET_MIN_WIDTH = 600;
const LARGE_TABLET_MIN_WIDTH = 900;

export type Responsive = {
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  formColumns: 1 | 2;
  formMaxWidth?: number;
  contentMaxWidth?: number;
};

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const isLargeTablet = width >= LARGE_TABLET_MIN_WIDTH;

  return {
    width,
    height,
    isPhone: !isTablet,
    isTablet,
    isLargeTablet,
    isLandscape: width > height,
    formColumns: isTablet ? 2 : 1,
    formMaxWidth: isLargeTablet ? 940 : isTablet ? 820 : undefined,
    contentMaxWidth: isLargeTablet ? 1040 : isTablet ? 900 : undefined,
  };
}
