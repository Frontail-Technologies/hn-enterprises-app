import { Children, ReactNode } from "react";

import { Reveal } from "./Reveal";

type RevealGroupProps = {
  children: ReactNode;
};

// Same per-child staggered reveal Screen.tsx applies automatically to a
// screen's top-level sections, packaged standalone for screens that opt out
// of that (revealContent={false}) because they're paged/tabbed - Screen's
// reveal only fires once per screen mount, which doesn't fit a PagerView
// page that stays mounted while the user swipes between tabs. Wrap a panel's
// own top-level sections (Cards, etc.) in this instead, at the panel level.
export function RevealGroup({ children }: RevealGroupProps) {
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={index} index={index}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
