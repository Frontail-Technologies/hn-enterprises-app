import type { PropsWithChildren } from "react";

export function StickyHeaderGroup({ children }: PropsWithChildren) {
  return <>{children}</>;
}

StickyHeaderGroup.displayName = "StickyHeaderGroup";
StickyHeaderGroup.isStickyHeader = true;
