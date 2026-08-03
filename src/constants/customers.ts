import type { CustomerGridColumnKey } from '@/types/customers';
import type { FilterableColumnWithWidth } from '@/types/table';

export const customerGridColumns: FilterableColumnWithWidth<CustomerGridColumnKey>[] = [
  { key: 'trBpNo', label: 'BP / TR', width: 116 },
  { key: 'customerName', label: 'Name', width: 150 },
  { key: 'fullAddress', label: 'Address', width: 260 },
  { key: 'mobileNo', label: 'Phone', width: 126 },
  { key: 'siteArea', label: 'Site', width: 150 },
  { key: 'status', label: 'Status', width: 116 },
];
