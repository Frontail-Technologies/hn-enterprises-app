import { useCallback, useRef, useState } from 'react';
import PagerView from 'react-native-pager-view';
import type { PagerViewOnPageSelectedEvent } from 'react-native-pager-view';

export function useSwipeableTabs(tabKeys: string[], initialKey?: string) {
  const [activeKey, setActiveKey] = useState(initialKey ?? tabKeys[0]);
  const pagerRef = useRef<PagerView>(null);
  const initialIndex = Math.max(tabKeys.indexOf(activeKey), 0);

  // Mounting every tab's content at once is expensive when tabs carry forms/uploaders,
  // and that cost shows up as lag while swiping. Only mount a tab once it's actually
  // been reached, plus its immediate neighbours, so swiping one step still feels instant
  // - once mounted a tab stays mounted so in-progress input isn't lost.
  const [mountedKeys, setMountedKeys] = useState<Set<string>>(() => new Set([activeKey]));

  const ensureMounted = useCallback(
    (key: string) => {
      const index = tabKeys.indexOf(key);
      if (index < 0) return;

      setMountedKeys((current) => {
        const next = new Set(current);
        let changed = false;
        for (const neighbourIndex of [index - 1, index, index + 1]) {
          const neighbourKey = tabKeys[neighbourIndex];
          if (neighbourKey && !next.has(neighbourKey)) {
            next.add(neighbourKey);
            changed = true;
          }
        }
        return changed ? next : current;
      });
    },
    [tabKeys],
  );

  const selectTab = useCallback(
    (key: string) => {
      const index = tabKeys.indexOf(key);
      if (index < 0) return;
      setActiveKey(key);
      ensureMounted(key);
      pagerRef.current?.setPage(index);
    },
    [ensureMounted, tabKeys],
  );

  const onPageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const key = tabKeys[event.nativeEvent.position];
      if (key) {
        setActiveKey(key);
        ensureMounted(key);
      }
    },
    [ensureMounted, tabKeys],
  );

  const isMounted = useCallback((key: string) => mountedKeys.has(key), [mountedKeys]);

  return {
    activeKey,
    pagerRef,
    initialIndex,
    onPageSelected,
    isMounted,
    selectTab,
  };
}
