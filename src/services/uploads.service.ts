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
    timeoutMs: 60000,
    onProgress,
  });
}

export function resolveMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getApiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}
