export type CustomerGridRow = {
  id: string;
  trBpNo: string;
  customerName: string;
  fullAddress: string;
  mobileNo: string;
  projectName: string;
  siteArea: string;
  status: string;
  canOpen: boolean;
};

export type CustomerGridColumnKey = keyof Pick<
  CustomerGridRow,
  'trBpNo' | 'customerName' | 'fullAddress' | 'mobileNo' | 'status'
>;
