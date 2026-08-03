import type { ComplaintStatus } from '@/services/complaints.service';
import type { ComplaintStatusFilter } from '@/types/complaints';

export const complaintStatusLabels: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const complaintStatusOptions: { label: string; value: ComplaintStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

export const complaintStatusFilters: ComplaintStatusFilter[] = [
  'All',
  'open',
  'in_progress',
  'resolved',
  'closed',
];
