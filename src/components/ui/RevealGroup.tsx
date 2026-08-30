import { Children, ReactNode } from "react";

import { Reveal, getChildFlexStyle } from "./Reveal";

type RevealGroupProps = {
  children: ReactNode;
};

export function RevealGroup({ children }: RevealGroupProps) {
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={index} index={index} style={getChildFlexStyle(child)}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
