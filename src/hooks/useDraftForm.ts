import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { isEqualSnapshot } from '@/utils/isEqualSnapshot';

type DraftState = 'idle' | 'loaded' | 'saved' | 'submitted';

const AUTOSAVE_DEBOUNCE_MS = 700;

function scopedDraftKey(userId: string, logicalKey: string) {
  return `draft:${userId}:${logicalKey}`;
}

export function useDraftForm<T extends Record<string, unknown>>(logicalKey: string, initialValues: T) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const draftKey = userId ? scopedDraftKey(userId, logicalKey) : null;

  const [initialSnapshot, setInitialSnapshot] = useState<T>(() => initialValues);
  const [values, setValues] = useState<T>(() => initialValues);
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [loadingDraft, setLoadingDraft] = useState(true);

  const valuesRef = useRef(values);
  const draftKeyRef = useRef(draftKey);
  useEffect(() => {
    valuesRef.current = values;
    draftKeyRef.current = draftKey;
  });
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    dirtyRef.current = false;

    async function loadDraft() {
      void AsyncStorage.removeItem(logicalKey).catch(() => undefined);

      if (!draftKey) {
        if (mounted) setLoadingDraft(false);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(draftKey);
        if (!mounted) return;

        if (stored) {
          setValues((current) => ({ ...current, ...JSON.parse(stored) }));
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
  }, [draftKey, logicalKey]);

  const persistDraft = useCallback(async () => {
    const key = draftKeyRef.current;
    if (!key || !dirtyRef.current) return;
    try {
      await AsyncStorage.setItem(key, JSON.stringify(valuesRef.current));
    } catch {
      // Losing an autosave write is non-fatal - values still live in component
      // state, and the next edit or background flush will retry.
    }
  }, []);

  const updateField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    dirtyRef.current = true;
    setValues((current) => ({ ...current, [key]: value }));
    setDraftState('idle');
  }, []);

  useEffect(() => {
    if (loadingDraft || !dirtyRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void persistDraft();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [values, loadingDraft, persistDraft]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        void persistDraft();
      }
    });

    return () => subscription.remove();
  }, [persistDraft]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      void persistDraft();
    };
  }, [persistDraft]);

  const saveDraft = useCallback(async () => {
    if (!draftKey) return;
    dirtyRef.current = true;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await AsyncStorage.setItem(draftKey, JSON.stringify(values));
    setDraftState('saved');
  }, [draftKey, values]);

  const clearDraft = useCallback(async () => {
    dirtyRef.current = false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (draftKey) await AsyncStorage.removeItem(draftKey);
    setDraftState('submitted');
    setInitialSnapshot(valuesRef.current);
  }, [draftKey]);

  const isDirty = useMemo(() => !isEqualSnapshot(values, initialSnapshot), [values, initialSnapshot]);

  return {
    values,
    setValues,
    updateField,
    saveDraft,
    clearDraft,
    draftState,
    loadingDraft,
    isDirty,
  };
}
