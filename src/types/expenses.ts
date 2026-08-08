import type { ExpenseCategory, ExpenseMode, ExpenseRecord, ExpenseStatus } from '@/services/expenses.service';
import type { EvidenceFile } from '@/services/mockData';

export type ExpenseStatusFilter = 'All' | ExpenseStatus;

export type ExpenseGridRow = ExpenseRecord;

export type ExpenseColumnKey = 'purpose' | 'paidTo' | 'address' | 'amount' | 'date' | 'status';

export type ExpenseDraft = {
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  plumberId: string;
  customerId: string;
  siteId: string;
  address: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
};
