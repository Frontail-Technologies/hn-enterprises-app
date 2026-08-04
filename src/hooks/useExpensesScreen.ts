import { useMemo, useState } from 'react';

import { expenseGridColumns, expenseStatusOptions } from '@/constants/expenses';
import { useToast } from '@/context/ToastContext';
import { useColumnFilters } from '@/hooks/useColumnFilters';
import {
  useCreateExpenseMutation,
  useExpensesQuery,
  useExpenseSiteOptionsQuery,
  useUpdateExpenseMutation,
} from '@/queries';
import { ApiError } from '@/services/apiClient';
import type { ExpenseRecord, ExpenseStatus } from '@/services/expenses.service';
import type { ExpenseDraft, ExpenseGridRow } from '@/types/expenses';

export const draftStatusOptions = expenseStatusOptions.filter(
  (option): option is { label: string; value: ExpenseStatus } => option.value !== 'All',
);

function emptyDraft(): ExpenseDraft {
  return {
    category: 'other_expense',
    purpose: '',
    paidTo: '',
    siteId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMode: 'cash',
    status: 'draft',
    remarks: '',
    evidence: [],
  };
}

export function useExpensesScreen() {
  const { showToast } = useToast();
  const expensesQuery = useExpensesQuery();
  const siteOptionsQuery = useExpenseSiteOptionsQuery();
  const createExpenseMutation = useCreateExpenseMutation();
  const updateExpenseMutation = useUpdateExpenseMutation();
  const expenses = useMemo(() => expensesQuery.data ?? [], [expensesQuery.data]);
  const sites = useMemo(() => siteOptionsQuery.data ?? [], [siteOptionsQuery.data]);
  const isLoading = expensesQuery.isLoading || siteOptionsQuery.isLoading;
  const isSaving = createExpenseMutation.isPending || updateExpenseMutation.isPending;

  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftCategoryOpen, setDraftCategoryOpen] = useState(false);
  const [draftSiteOpen, setDraftSiteOpen] = useState(false);
  const [draftModeOpen, setDraftModeOpen] = useState(false);
  const [draftStatusOpen, setDraftStatusOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExpenseDraft>(emptyDraft());

  const siteNameById = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const siteSelectOptions = useMemo(
    () => sites.map((site) => ({ label: site.name, value: site.id })),
    [sites],
  );

  const rows = useMemo<ExpenseGridRow[]>(
    () => expenses.map((expense) => ({ ...expense, site: siteNameById.get(expense.siteId) ?? '' })),
    [expenses, siteNameById],
  );

  const {
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    matchesFilters,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
  } = useColumnFilters(expenseGridColumns, rows);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((expense) => {
      const matchesFromDate = fromDate ? expense.date >= fromDate : true;
      const matchesToDate = toDate ? expense.date <= toDate : true;
      const matchesSearch =
        !query ||
        [expense.purpose, expense.paidTo, expense.site, expense.paymentMode, expense.status]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFromDate && matchesToDate && matchesSearch && matchesFilters(expense);
    });
  }, [rows, fromDate, matchesFilters, search, toDate]);

  const total = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const openAdd = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setSheetOpen(true);
  };

  const openEdit = (expense: ExpenseRecord) => {
    setEditingId(expense.id);
    setDraft({
      category: expense.category,
      purpose: expense.purpose,
      paidTo: expense.paidTo,
      siteId: expense.siteId,
      amount: expense.amount,
      date: expense.date,
      paymentMode: expense.paymentMode,
      status: expense.status,
      remarks: expense.remarks,
      evidence: expense.evidence,
    });
    setSheetOpen(true);
  };

  const saveExpense = async () => {
    if (!draft.purpose.trim() || !draft.amount.trim()) {
      showToast('Purpose and amount are required', 'error');
      return;
    }

    try {
      if (editingId) {
        await updateExpenseMutation.mutateAsync({ id: editingId, input: draft });
        showToast('Expense updated', 'success');
      } else {
        await createExpenseMutation.mutateAsync(draft);
        showToast('Expense added', 'success');
      }
      setSheetOpen(false);
    } catch (error) {
      console.error('[useExpensesScreen] save failed', {
        editingId,
        category: draft.category,
        evidenceCount: draft.evidence.length,
        error,
      });
      const message = error instanceof ApiError ? error.message : 'Unable to save expense';
      showToast(message, 'error');
    }
  };

  const updateDraft = <K extends keyof ExpenseDraft>(key: K, value: ExpenseDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setFilterSheetOpen(false);
  };

  return {
    isLoading,
    isSaving,
    expenses,
    rows,
    filteredExpenses,
    total,
    siteSelectOptions,
    search,
    setSearch,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    filterSheetOpen,
    setFilterSheetOpen,
    sheetOpen,
    setSheetOpen,
    draftCategoryOpen,
    setDraftCategoryOpen,
    draftSiteOpen,
    setDraftSiteOpen,
    draftModeOpen,
    setDraftModeOpen,
    draftStatusOpen,
    setDraftStatusOpen,
    editingId,
    draft,
    openAdd,
    openEdit,
    saveExpense,
    updateDraft,
    resetFilters,
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
  };
}
