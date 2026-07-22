import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

type DraftState = 'idle' | 'loaded' | 'saved' | 'submitted';

export function useDraftForm<T extends Record<string, unknown>>(draftKey: string, initialValues: T) {
  const initialRef = useRef(initialValues);
  const [values, setValues] = useState<T>(() => initialValues);
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [loadingDraft, setLoadingDraft] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDraft() {
      try {
        const stored = await AsyncStorage.getItem(draftKey);
        if (!mounted) return;

        if (stored) {
          setValues({ ...initialRef.current, ...JSON.parse(stored) });
          setDraftState('loaded');
        }
      } finally {
        if (mounted) setLoadingDraft(false);
      }
    }

    loadDraft();

    return () => {
      mounted = false;
    };
  }, [draftKey]);

  const updateField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDraftState('idle');
  }, []);

  const saveDraft = useCallback(async () => {
    await AsyncStorage.setItem(draftKey, JSON.stringify(values));
    setDraftState('saved');
  }, [draftKey, values]);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(draftKey);
    setDraftState('submitted');
  }, [draftKey]);

  return {
    values,
    setValues,
    updateField,
    saveDraft,
    clearDraft,
    draftState,
    loadingDraft,
  };
}
