export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
export const MAX_EVIDENCE_COUNT = 12;

export const ALLOWED_DOCUMENT_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const IMAGE_EXTENSION_RE = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;

export function isImageAsset(mimeType: string | null | undefined, fileName?: string | null) {
  if (mimeType?.startsWith('image/')) return true;
  return Boolean(fileName && IMAGE_EXTENSION_RE.test(fileName));
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
