import { useCallback, useRef } from 'react';

export function useLockedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => Promise<void> | void,
) {
  const lockedRef = useRef(false);

  return useCallback(
    async (...args: TArgs) => {
      if (lockedRef.current) return;
      lockedRef.current = true;

      try {
        await callback(...args);
      } finally {
        lockedRef.current = false;
      }
    },
    [callback],
  );
}
