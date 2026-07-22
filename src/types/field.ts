import type { CapturedLocation } from '@/hooks/useCurrentLocation';
import type { UploadedFile } from './common';

export type FieldEvidence = UploadedFile & {
  caption?: string;
  location?: CapturedLocation;
};

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Not Marked';

export type PipeStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Laying Completed'
  | 'Testing Pending'
  | 'Testing Completed'
  | 'Purging Completed'
  | 'Not Required'
  | 'On Hold';
