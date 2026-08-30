import type { FilterableColumn } from '@/hooks/useColumnFilters';
import { expenseCategoryOptions, type ExpenseCategory, type ExpenseMode, type ExpenseStatus } from '@/services/expenses.service';
import type { ExpenseColumnKey, ExpenseStatusFilter } from '@/types/expenses';

export const expenseStatusOptions: { label: string; value: ExpenseStatusFilter }[] = [
  { label: 'All Status', value: 'All' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export const expenseModeOptions: { label: string; value: ExpenseMode }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI', value: 'upi' },
  { label: 'NEFT', value: 'neft' },
  { label: 'Bank Transfer', value: 'bank_transfer' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Other', value: 'other' },
];

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const expenseGridColumns: FilterableColumn<ExpenseColumnKey>[] = [
  { key: 'paidTo', label: 'Paid To' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
];

const EM_DASH = '—';

export const SUPERVISOR_VISIBLE_EXPENSE_CATEGORIES: ExpenseCategory[] = ['plumber_payment', 'other_expense'];

const CATEGORY_LABELS = new Map(expenseCategoryOptions.map((option) => [option.value, option.label]));
const MODE_LABELS = new Map(expenseModeOptions.map((option) => [option.value, option.label]));

function humanizeToken(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatExpenseCategory(value: ExpenseCategory) {
  return CATEGORY_LABELS.get(value) ?? humanizeToken(value);
}

export function formatExpenseMode(value: string) {
  if (!value) return EM_DASH;
  return MODE_LABELS.get(value) ?? humanizeToken(value);
}
