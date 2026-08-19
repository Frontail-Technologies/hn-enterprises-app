import { apiRequestFormData, getApiOrigin } from "./apiClient";

export type UploadedFile = {
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
};

export type UploadAsset = {
  uri: string;
  fileName: string;
  mimeType?: string;
};

// React Native's `{ uri, name, type }` file object isn't a real `Blob` -
// `FormData.append`'s DOM typings require one, so this cast is a necessary,
// deliberate escape hatch (not a type-safety gap). It was copy-pasted at
// every call site that appends a file; this is the one place it's written.
export function toFormDataFilePart(asset: UploadAsset): Blob {
  return {
    uri: asset.uri,
    name: asset.fileName,
    type: asset.mimeType || "application/octet-stream",
  } as unknown as Blob;
}

export async function uploadFile(
  asset: UploadAsset,
  module: string,
  recordId?: string,
  onProgress?: (fraction: number) => void,
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", toFormDataFilePart(asset));
  formData.append("module", module);
  if (recordId) formData.append("recordId", recordId);

  return apiRequestFormData<UploadedFile>("/uploads", formData, {
    // Camera photos can be several MB - the default request timeout is tuned for
    // quick JSON calls and is too short for a real upload over a mobile network.
    timeoutMs: 60000,
    onProgress,
  });
}

export function resolveMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getApiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}
