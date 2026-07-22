import { createContext, useContext } from 'react';

export type ScrollIntoViewFn = (node: unknown) => void;

const ScrollIntoViewContext = createContext<ScrollIntoViewFn | null>(null);

export const ScrollIntoViewProvider = ScrollIntoViewContext.Provider;

export function useScrollIntoView() {
  return useContext(ScrollIntoViewContext);
}
