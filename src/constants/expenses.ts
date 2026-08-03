import type { FilterableColumn } from '@/hooks/useColumnFilters';
import type { ExpenseMode, ExpenseStatus } from '@/services/expenses.service';
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
  { key: 'purpose', label: 'Purpose' },
  { key: 'paidTo', label: 'Paid To' },
  { key: 'site', label: 'Site' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
];
