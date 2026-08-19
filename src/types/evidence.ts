export type EvidenceFile = {
  id: string;
  label?: string;
  fileName: string;
  uri?: string;
  fileUrl?: string;
  mimeType?: string;
  caption?: string;
  status?: 'Pending' | 'Uploading' | 'Uploaded' | 'Failed';
  errorMessage?: string;
  uploadedOn?: string;
  capturedAt?: string;
  gpsLocation?: string;
};
