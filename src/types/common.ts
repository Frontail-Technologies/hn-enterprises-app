export type EntityStatus = 'Active' | 'Inactive' | 'Pending' | 'Approved' | 'Rejected';

export type SelectOption<TValue extends string = string> = {
  label: string;
  value: TValue;
};

export type UploadedFile = {
  id: string;
  name: string;
  uri: string;
  mimeType?: string;
  uploadedAt?: string;
};
