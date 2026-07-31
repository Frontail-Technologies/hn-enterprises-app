import { apiRequest, getApiOrigin } from "./apiClient";

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

export async function uploadFile(asset: UploadAsset, module: string, recordId?: string): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append("file", {
    uri: asset.uri,
    name: asset.fileName,
    type: asset.mimeType || "application/octet-stream",
  } as unknown as Blob);
  formData.append("module", module);
  if (recordId) formData.append("recordId", recordId);

  return apiRequest<UploadedFile>("/uploads", {
    method: "POST",
    body: formData,
  });
}

export function resolveMediaUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getApiOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}
