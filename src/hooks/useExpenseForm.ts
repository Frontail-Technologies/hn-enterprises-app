import { useEffect, useMemo, useRef, useState } from 'react';

import { expenseStatusOptions, SUPERVISOR_VISIBLE_EXPENSE_CATEGORIES } from '@/constants/expenses';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  useCreateExpenseMutation,
  useExpenseQuery,
  useExpensesQuery,
  useMasterValuesQuery,
  usePlumbersOptionsQuery,
  useUpdateExpenseMutation,
} from '@/queries';
import { ApiError } from '@/services/apiClient';
import { expenseCategoryOptions, type ExpenseCategory, type ExpenseRecord, type ExpenseStatus } from '@/services/expenses.service';
import type { ExpenseDraft } from '@/types/expenses';
import { normalizeError } from '@/utils/normalizeError';

export const draftStatusOptions = expenseStatusOptions.filter(
  (option): option is { label: string; value: ExpenseStatus } => option.value !== 'All',
);

export type ExpenseFieldKey = 'purpose' | 'amount';

function emptyDraft(defaultCategory: ExpenseCategory): ExpenseDraft {
  return {
    category: defaultCategory,
    purpose: '',
    paidTo: '',
    plumberId: '',
    customerId: '',
    siteId: '',
    address: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'cash',
    status: 'draft',
    remarks: '',
    evidence: [],
  };
}

function toDraft(expense: ExpenseRecord): ExpenseDraft {
  return {
    category: expense.category,
    purpose: expense.purpose,
    paidTo: expense.paidTo,
    plumberId: expense.plumberId,
    customerId: expense.customerId,
    siteId: expense.siteId,
    address: expense.address,
    amount: expense.amount,
    date: expense.date,
    paymentMode: expense.paymentMode,
    status: expense.status,
    remarks: expense.remarks,
    evidence: expense.evidence,
  };
}

export function useExpenseForm(expenseId?: string) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const listQuery = useExpensesQuery();
  const detailQuery = useExpenseQuery(expenseId);
  const createMutation = useCreateExpenseMutation();
  const updateMutation = useUpdateExpenseMutation();
  const plumbersQuery = usePlumbersOptionsQuery();
  const paymentModesQuery = useMasterValuesQuery('Payment Types');

  const categoryOptions = useMemo(
    () =>
      user?.role === 'supervisor'
        ? expenseCategoryOptions.filter((option) =>
            SUPERVISOR_VISIBLE_EXPENSE_CATEGORIES.includes(option.value),
          )
        : expenseCategoryOptions,
    [user?.role],
  );
  const defaultCategory: ExpenseCategory = user?.role === 'supervisor' ? 'plumber_payment' : 'worker_payment';

  const cached = useMemo(
    () => (expenseId ? (listQuery.data ?? []).find((item) => item.id === expenseId) : undefined),
    [listQuery.data, expenseId],
  );
  const detail = detailQuery.data ?? cached;

  const [initial, setInitial] = useState<ExpenseDraft>(() => (cached ? toDraft(cached) : emptyDraft(defaultCategory)));
  const [draft, setDraft] = useState<ExpenseDraft>(() => (cached ? toDraft(cached) : emptyDraft(defaultCategory)));
  const [errors, setErrors] = useState<Partial<Record<ExpenseFieldKey, string>>>({});
  const mountPlaceholder = useRef<ExpenseDraft>(cached ? toDraft(cached) : emptyDraft(defaultCategory));
  const hydratedRef = useRef<boolean>(!expenseId || Boolean(detailQuery.data));

  useEffect(() => {
    if (hydratedRef.current || !detailQuery.data) return;
    hydratedRef.current = true;
    const seeded = toDraft(detailQuery.data);
    setInitial(seeded);
    setDraft((current) =>
      JSON.stringify(current) === JSON.stringify(mountPlaceholder.current) ? seeded : current,
    );
  }, [detailQuery.data]);

  const isEdit = Boolean(expenseId);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);

  const hasDetail = Boolean(detail);
  const detailError = detailQuery.error instanceof ApiError ? detailQuery.error : null;
  const loading = isEdit && !hasDetail && detailQuery.isLoading;
  const notFound = isEdit && !hasDetail && detailError?.status === 404;
  const loadError = isEdit && !hasDetail && detailQuery.isError && !notFound;

  const plumberOptions = useMemo(
    () => (plumbersQuery.data ?? []).map((plumber) => ({ label: plumber.name, value: plumber.id })),
    [plumbersQuery.data],
  );
  const paymentModeOptions = useMemo(
    () => (paymentModesQuery.data ?? []).map((mode) => ({ label: mode, value: mode })),
    [paymentModesQuery.data],
  );

  const updateDraft = <K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key === 'purpose' || key === 'amount') {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = (): { errors: Partial<Record<ExpenseFieldKey, string>>; firstInvalid: ExpenseFieldKey | null } => {
    const next: Partial<Record<ExpenseFieldKey, string>> = {};
    if (!draft.purpose.trim()) next.purpose = 'Purpose is required.';
    if (!draft.amount.trim()) next.amount = 'Amount is required.';
    setErrors(next);
    const order: ExpenseFieldKey[] = ['purpose', 'amount'];
    const firstInvalid = order.find((key) => next[key]) ?? null;
    return { errors: next, firstInvalid };
  };

  const save = async (): Promise<{ ok: boolean; firstInvalid?: ExpenseFieldKey | null }> => {
    if (isEdit && !dirty) return { ok: true };

    const { firstInvalid } = validate();
    if (firstInvalid) return { ok: false, firstInvalid };

    try {
      if (expenseId) {
        const saved = await updateMutation.mutateAsync({ id: expenseId, input: draft });
        setInitial(toDraft(saved));
        showToast('Expense updated', 'success');
      } else {
        await createMutation.mutateAsync(draft);
        showToast('Expense added', 'success');
      }
      return { ok: true };
    } catch (error) {
      console.error('[useExpenseForm] save failed', { expenseId, category: draft.category, error });
      showToast(normalizeError(error, 'Unable to save expense'), 'error');
      return { ok: false };
    }
  };

  return {
    draft,
    errors,
    updateDraft,
    save,
    isEdit,
    isSaving,
    dirty,
    loading,
    loadError,
    notFound,
    refetchDetail: detailQuery.refetch,
    plumberOptions,
    plumbersLoading: plumbersQuery.isLoading,
    plumbersError: plumbersQuery.isError,
    refetchPlumbers: plumbersQuery.refetch,
    paymentModeOptions,
    modesLoading: paymentModesQuery.isLoading,
    modesError: paymentModesQuery.isError,
    refetchModes: paymentModesQuery.refetch,
    categoryOptions,
    statusOptions: draftStatusOptions,
  };
}
