import type { PropsWithChildren } from 'react';

// Combines multiple header-like children (e.g. AppHeader + SectionTabBar) into a
// single element so Screen's single-index sticky-header mechanism pins them together
// as one block, rather than relying on React Native's less-common adjacent
// multi-index sticky-header stacking behavior.
export function StickyHeaderGroup({ children }: PropsWithChildren) {
  return <>{children}</>;
}

StickyHeaderGroup.displayName = 'StickyHeaderGroup';
