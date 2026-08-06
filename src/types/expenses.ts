import type { ExpenseCategory, ExpenseMode, ExpenseRecord, ExpenseStatus } from '@/services/expenses.service';
import type { EvidenceFile } from '@/services/mockData';

export type ExpenseStatusFilter = 'All' | ExpenseStatus;

export type ExpenseGridRow = ExpenseRecord & { site: string };

export type ExpenseColumnKey = 'purpose' | 'paidTo' | 'site' | 'amount' | 'date' | 'status';

export type ExpenseDraft = {
  category: ExpenseCategory;
  purpose: string;
  paidTo: string;
  plumberId: string;
  siteId: string;
  amount: string;
  date: string;
  paymentMode: ExpenseMode;
  status: ExpenseStatus;
  remarks: string;
  evidence: EvidenceFile[];
};
