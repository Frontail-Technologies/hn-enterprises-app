import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';

type DraftState = 'idle' | 'loaded' | 'saved' | 'submitted';

// How long to wait after the last edit before writing the draft to disk. Keeps
// AsyncStorage off the critical path of every keystroke while still capturing
// in-progress input within a second of the user pausing.
const AUTOSAVE_DEBOUNCE_MS = 700;

// Drafts are namespaced by the authenticated user so that, on a shared device,
// one supervisor can never restore another's in-progress form. The caller's
// logical key (e.g. `customer:<id>:survey`) is prefixed with the user id. The
// `draft:` prefix also guarantees these never collide with the pre-scoping,
// unscoped keys - so a legacy draft can never be silently attributed to whoever
// happens to be logged in (it is purged instead, see the load effect).
function scopedDraftKey(userId: string, logicalKey: string) {
  return `draft:${userId}:${logicalKey}`;
}

export function useDraftForm<T extends Record<string, unknown>>(logicalKey: string, initialValues: T) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Without an authenticated identity to scope it to, there is no key - the hook
  // simply does no draft I/O (load or persist) in that state.
  const draftKey = userId ? scopedDraftKey(userId, logicalKey) : null;

  const initialRef = useRef(initialValues);
  const [values, setValues] = useState<T>(() => initialValues);
  const [draftState, setDraftState] = useState<DraftState>('idle');
  const [loadingDraft, setLoadingDraft] = useState(true);

  // Latest values/key mirrored into refs so the AppState listener and unmount
  // flush can persist without re-subscribing on every edit. Synced in a
  // post-commit effect rather than during render (writing refs during render is
  // disallowed under the React Compiler).
  const valuesRef = useRef(values);
  const draftKeyRef = useRef(draftKey);
  useEffect(() => {
    valuesRef.current = values;
    draftKeyRef.current = draftKey;
  });
  // Only ever persist a form the user has actually touched. A pristine, freshly
  // loaded form must not write a draft that could later shadow fresher server
  // data on the next open.
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    // A changed key means a different form identity (a different user, or a
    // different pipe record) - it starts pristine, so any pending edit-flag from
    // the previous key must not carry over.
    dirtyRef.current = false;

    async function loadDraft() {
      // Purge any legacy, pre-scoping draft stored under the bare (unscoped)
      // logical key. Its ownership can't be proven, so it's never restored -
      // removed instead, favouring safety over migration. Cheap and idempotent;
      // safe because pre-scoping autosave never shipped to real devices.
      void AsyncStorage.removeItem(logicalKey).catch(() => undefined);

      if (!draftKey) {
        if (mounted) setLoadingDraft(false);
        return;
      }

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
  }, [draftKey, logicalKey]);

  // Best-effort write of the current values under the current scoped key.
  // No-ops until the form is dirty (so pristine forms never leave a draft) and
  // when there is no authenticated scope.
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

  // Debounced autosave: reschedule on every edit, write once the user pauses.
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

  // Flush immediately when the app leaves the foreground (backgrounded, or an
  // OS overlay like the camera/gallery takes over) - the debounce timer would
  // otherwise be paused and could be killed with the process.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        void persistDraft();
      }
    });

    return () => subscription.remove();
  }, [persistDraft]);

  // Flush any pending debounce when the form unmounts (e.g. navigating away
  // before the timer fires) so a partly-typed form isn't lost.
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
    // Cancel any queued autosave first - otherwise a debounce timer scheduled
    // just before submit could fire after removeItem and resurrect the draft
    // we just cleared.
    dirtyRef.current = false;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (draftKey) await AsyncStorage.removeItem(draftKey);
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
