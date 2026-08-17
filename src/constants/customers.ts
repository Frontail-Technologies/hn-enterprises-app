import type { CustomerGridColumnKey } from '@/types/customers';
import type { FilterableColumnWithWidth } from '@/types/table';

export const customerGridColumns: FilterableColumnWithWidth<CustomerGridColumnKey>[] = [
  { key: 'trBpNo', label: 'BP / TR', width: 130 },
  { key: 'customerName', label: 'Customer', width: 165 },
  { key: 'siteArea', label: 'Site', width: 120 },
  { key: 'status', label: 'Status', width: 110 },
  { key: 'mobileNo', label: 'Mobile', width: 120 },
  { key: 'supervisorName', label: 'Supervisor', width: 145 },
  { key: 'fullAddress', label: 'Address', width: 210 },
];
