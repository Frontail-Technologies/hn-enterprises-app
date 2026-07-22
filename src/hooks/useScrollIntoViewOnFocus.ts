import { useRef } from 'react';
import type { TextInput } from 'react-native';

import { useScrollIntoView } from '@/context/ScrollIntoViewContext';

export function useScrollIntoViewOnFocus() {
  const ref = useRef<TextInput>(null);
  const scrollIntoView = useScrollIntoView();

  const onFocus = () => {
    scrollIntoView?.(ref.current);
  };

  return { ref, onFocus };
}
