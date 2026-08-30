import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, FileText, ImageIcon, Plus, RefreshCcw, RotateCcw, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import {
  ALLOWED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
  MAX_EVIDENCE_COUNT,
  MAX_IMAGE_BYTES,
  formatBytes,
  isImageAsset,
} from '@/constants/uploads';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import type { EvidenceFile } from '@/types/evidence';
import { processEvidenceImage } from '@/services/imageProcessing';
import { resolveMediaUrl, uploadFile, type UploadAsset } from '@/services/uploads.service';
import { normalizeError } from '@/utils/normalizeError';

type EvidenceUploaderProps = {
  title?: string;
  initialFiles?: EvidenceFile[];
  module: string;
  recordId?: string;
  onChange?: (files: EvidenceFile[]) => void;
  readOnly?: boolean;
  deferUpload?: boolean;
};

type PendingAsset = {
  uri: string;
  originalName: string;
  mimeType?: string;
  size?: number | null;
  width?: number | null;
  height?: number | null;
  assetId?: string | null;
  isImage: boolean;
  label: string;
};

const IMAGE_EXTENSION_RE = /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i;

export function isImageFile(file: Pick<EvidenceFile, 'mimeType' | 'fileName' | 'uri'>) {
  return Boolean(
    file.mimeType?.startsWith('image/') ||
      IMAGE_EXTENSION_RE.test(file.fileName) ||
      (file.uri && IMAGE_EXTENSION_RE.test(file.uri)),
  );
}

function displayName(file: EvidenceFile, index: number) {
  return file.label?.trim() || `Photo ${index + 1}`;
}

export function EvidenceUploader({
  title = 'Evidence Photos',
  initialFiles = [],
  module,
  recordId,
  onChange,
  readOnly = false,
  deferUpload = false,
}: EvidenceUploaderProps) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles);
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressById, setProgressById] = useState<Record<string, number>>({});

  const openSheet = () => {
    setPendingAssets([]);
    setSheetOpen(true);
  };
  const closeSheet = () => {
    setSheetOpen(false);
    setPendingAssets([]);
  };

  const queueAssets = (incoming: PendingAsset[]) => {
    const available = MAX_EVIDENCE_COUNT - (files.length + pendingAssets.length);
    if (available <= 0) {
      showToast(`You can attach up to ${MAX_EVIDENCE_COUNT} files.`, 'warning');
      return;
    }

    const accepted: PendingAsset[] = [];
    let rejection: string | null = null;

    for (const asset of incoming) {
      if (accepted.length >= available) {
        rejection = rejection ?? `You can attach up to ${MAX_EVIDENCE_COUNT} files.`;
        break;
      }
      const error = validateAsset(asset);
      if (error) {
        rejection = rejection ?? error;
        continue;
      }
      accepted.push(asset);
    }

    if (accepted.length) setPendingAssets((current) => [...current, ...accepted]);
    if (rejection) showToast(rejection, 'error');
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast('Camera permission is required.', 'error');
      return;
    }

    // quality < 1 asks the native picker to compress the capture itself, instead of handing
    // back a full-resolution (12-48MP+) decoded original that processEvidenceImage below is
    // just going to downscale/recompress anyway - avoids the extra memory pressure of decoding
    // the largest possible source image only to immediately shrink it.
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    queueAssets(result.assets.map((asset) => fromImageAsset(asset)));
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) return;
    queueAssets(result.assets.map((asset) => fromImageAsset(asset)));
  };

  const pickFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;

    queueAssets(
      result.assets.map((asset) => ({
        uri: asset.uri,
        originalName: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
        isImage: isImageAsset(asset.mimeType, asset.name),
        label: '',
      })),
    );
  };

  const updatePendingLabel = (index: number, label: string) => {
    setPendingAssets((current) => current.map((asset, i) => (i === index ? { ...asset, label } : asset)));
  };

  const removePending = (index: number) => {
    setPendingAssets((current) => current.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const persistable = files.filter((file) => file.fileUrl || (deferUpload && file.uri));
    onChange?.(persistable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, deferUpload]);

  const updateFiles = (updater: (current: EvidenceFile[]) => EvidenceFile[]) => {
    setFiles(updater);
  };

  const runUpload = async (id: string, asset: UploadAsset) => {
    setProgressById((current) => ({ ...current, [id]: 0 }));
    try {
      const uploaded = await uploadFile(asset, module, recordId, (fraction) => {
        setProgressById((current) => ({ ...current, [id]: fraction }));
      });
      updateFiles((current) =>
        current.map((file) =>
          file.id === id
            ? {
                ...file,
                uri: resolveMediaUrl(uploaded.url) ?? uploaded.url,
                fileUrl: uploaded.url,
                fileName: uploaded.fileName,
                status: 'Uploaded',
                errorMessage: undefined,
              }
            : file,
        ),
      );
    } catch (error) {
      const message = normalizeError(error, 'Unable to upload file');
      console.error('[EvidenceUploader] upload failed', { module, recordId, fileName: asset.fileName, error });
      updateFiles((current) =>
        current.map((file) => (file.id === id ? { ...file, status: 'Failed', errorMessage: message } : file)),
      );
    } finally {
      setProgressById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  };

  const confirmPending = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const capturedAt = new Date().toISOString();
      const stamp = Date.now();
      const staged: EvidenceFile[] = [];
      const rejected: string[] = [];

      for (let index = 0; index < pendingAssets.length; index += 1) {
        const asset = pendingAssets[index];
        const base = {
          id: `${asset.assetId ?? asset.uri}-${stamp}-${index}`,
          label: asset.label.trim() || undefined,
          status: (deferUpload ? 'Pending' : 'Uploading') as EvidenceFile['status'],
          capturedAt,
        };

        if (asset.isImage) {
          try {
            const processed = await processEvidenceImage(asset.uri, { width: asset.width, height: asset.height });
            if (processed.size && processed.size > MAX_IMAGE_BYTES) {
              rejected.push(`"${asset.originalName}" is still over ${formatBytes(MAX_IMAGE_BYTES)} after compression.`);
              continue;
            }
            staged.push({ ...base, fileName: `evidence-${stamp}-${index}.jpg`, uri: processed.uri, mimeType: processed.mimeType });
          } catch {
            rejected.push(`Couldn't process "${asset.originalName}". Please try another photo.`);
          }
        } else {
          staged.push({
            ...base,
            fileName: asset.originalName,
            uri: asset.uri,
            mimeType: asset.mimeType ?? 'application/octet-stream',
          });
        }
      }

      if (staged.length) {
        updateFiles((current) => [...current, ...staged]);
        closeSheet();
        if (!deferUpload) {
          staged.forEach((file) => {
            void runUpload(file.id, { uri: file.uri!, fileName: file.fileName, mimeType: file.mimeType });
          });
        }
      }
      if (rejected.length) showToast(rejected[0], 'error');
    } finally {
      setProcessing(false);
    }
  };

  const removeFile = (id: string) => {
    updateFiles((current) => current.filter((file) => file.id !== id));
  };

  const replaceFile = async (id: string) => {
    // pickFromGallery (above) checks this before presenting the picker - this call site was
    // missing the same check.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Photo library permission is required.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;

    const asset = result.assets[0];
    const processed = await processEvidenceImage(asset.uri, { width: asset.width, height: asset.height });
    updateFiles((current) =>
      current.map((file) =>
        file.id === id
          ? {
              ...file,
              uri: processed.uri,
              mimeType: processed.mimeType,
              fileUrl: deferUpload ? undefined : file.fileUrl,
              status: deferUpload ? 'Pending' : 'Uploading',
              capturedAt: new Date().toISOString(),
            }
          : file,
      ),
    );

    if (deferUpload) return;

    const existing = files.find((file) => file.id === id);
    const fileName = existing?.fileName ?? 'evidence.jpg';
    void runUpload(id, { uri: processed.uri, fileName, mimeType: processed.mimeType });
  };

  const retryFile = (id: string) => {
    const file = files.find((item) => item.id === id);
    if (!file?.uri) return;

    updateFiles((current) => current.map((item) => (item.id === id ? { ...item, status: 'Uploading' } : item)));
    void runUpload(id, { uri: file.uri, fileName: file.fileName, mimeType: file.mimeType });
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[typography.label, { color: colors.muted }]}>
          {files.length ? `${files.length} added` : 'None added'}
        </Text>
      </View>

      {readOnly ? null : (
        <Pressable
          onPress={openSheet}
          style={({ pressed }) => [
            styles.addButton,
            { borderColor: colors.border, backgroundColor: colors.card },
            pressed && { opacity: 0.84 },
          ]}
        >
          <Plus size={16} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Photo / Document</Text>
        </Pressable>
      )}

      {files.length ? (
        <View style={styles.fileList}>
          {files.map((file, index) => {
            const isImage = isImageFile(file);
            const progress = progressById[file.id];

            return (
              <View key={file.id} style={[styles.fileItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Pressable onPress={() => setPreviewFile(file)} style={[styles.thumb, { backgroundColor: colors.surfaceMuted }]}>
                  {isImage && file.uri ? (
                    <Image source={{ uri: file.uri }} style={styles.thumbImage} contentFit="cover" />
                  ) : (
                    <FileText size={22} color={colors.primary} />
                  )}
                </Pressable>
                <View style={styles.fileCopy}>
                  <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                    {displayName(file, index)}
                  </Text>
                  <Text style={[typography.label, { color: statusColor(file.status, colors) }]}>
                    {statusLabel(file.status, progress)}
                  </Text>
                  {file.status === 'Failed' && file.errorMessage ? (
                    <Text style={[typography.label, { color: colors.red }]} numberOfLines={2}>
                      {file.errorMessage}
                    </Text>
                  ) : null}
                  {file.gpsLocation ? (
                    <Text style={[typography.label, { color: colors.muted }]}>Location attached</Text>
                  ) : null}
                </View>
                {readOnly ? null : (
                  <View style={styles.fileActions}>
                    <Pressable onPress={() => replaceFile(file.id)} hitSlop={6}>
                      <RefreshCcw size={16} color={colors.primary} />
                    </Pressable>
                    {file.status === 'Failed' ? (
                      <Pressable onPress={() => retryFile(file.id)} hitSlop={6}>
                        <RotateCcw size={16} color={colors.red} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => removeFile(file.id)} hitSlop={6}>
                      <X size={16} color={colors.red} />
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      {readOnly ? null : (
        <Sheet visible={sheetOpen} onClose={closeSheet} title={title}>
          {pendingAssets.length === 0 ? (
            <>
              <View style={styles.actionRow}>
                <EvidenceAction icon={Camera} label="Camera" onPress={pickFromCamera} />
                <EvidenceAction icon={ImageIcon} label="Gallery" onPress={pickFromGallery} />
                <EvidenceAction icon={FileText} label="File" onPress={pickFromFiles} />
              </View>
            </>
          ) : (
            <>
              <Text style={[typography.label, { color: colors.muted }]}>Add an optional label for each file</Text>
              {pendingAssets.map((asset, index) => (
                <PendingAssetRow
                  key={`${asset.uri}-${index}`}
                  asset={asset}
                  onChangeLabel={(value) => updatePendingLabel(index, value)}
                  onRemove={() => removePending(index)}
                />
              ))}
              <View style={styles.confirmRow}>
                <Pressable
                  onPress={() => setPendingAssets([])}
                  style={[styles.confirmSecondary, { borderColor: colors.border }]}
                >
                  <Text style={[typography.label, { color: colors.text }]}>Add more</Text>
                </Pressable>
                <Pressable
                  onPress={confirmPending}
                  disabled={processing}
                  style={[styles.confirmPrimary, { backgroundColor: colors.primary, opacity: processing ? 0.7 : 1 }]}
                >
                  <Text style={[typography.label, styles.confirmPrimaryText]}>
                    {processing
                      ? 'Preparing…'
                      : `Add ${pendingAssets.length} file${pendingAssets.length === 1 ? '' : 's'}`}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Sheet>
      )}

      <Modal visible={Boolean(previewFile)} transparent animationType="fade" onRequestClose={() => setPreviewFile(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewFile(null)}>
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            {previewFile?.uri && isImageFile(previewFile) ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} contentFit="contain" />
            ) : (
              <FileText size={52} color={colors.primary} />
            )}
            <Text style={[styles.previewName, { color: colors.text }]}>
              {previewFile ? displayName(previewFile, 0) : ''}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function fromImageAsset(asset: ImagePicker.ImagePickerAsset): PendingAsset {
  return {
    uri: asset.uri,
    originalName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize,
    width: asset.width,
    height: asset.height,
    assetId: asset.assetId,
    isImage: true,
    label: '',
  };
}

function validateAsset(asset: PendingAsset): string | null {
  if (asset.isImage) return null;
  const name = asset.originalName;
  if (asset.mimeType && !ALLOWED_DOCUMENT_MIME.includes(asset.mimeType)) {
    return `"${name}" isn't a supported file type.`;
  }
  if (asset.size && asset.size > MAX_DOCUMENT_BYTES) {
    return `"${name}" is too large. Choose a file under ${formatBytes(MAX_DOCUMENT_BYTES)}.`;
  }
  return null;
}

function statusLabel(status: EvidenceFile['status'], progress?: number) {
  if (status === 'Uploading') return `Uploading ${Math.round((progress ?? 0) * 100)}%`;
  if (status === 'Failed') return 'Failed';
  if (status === 'Pending') return 'Ready to upload';
  return 'Uploaded';
}

function statusColor(status: EvidenceFile['status'], colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'Failed') return colors.red;
  if (status === 'Uploading') return colors.blue;
  if (status === 'Pending') return colors.muted;
  return colors.green;
}

function PendingAssetRow({
  asset,
  onChangeLabel,
  onRemove,
}: {
  asset: PendingAsset;
  onChangeLabel: (value: string) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.pendingRow, { borderColor: colors.border }]}>
      <View style={[styles.thumb, styles.pendingThumb, { backgroundColor: colors.surfaceMuted }]}>
        {asset.isImage ? (
          <Image source={{ uri: asset.uri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <FileText size={20} color={colors.primary} />
        )}
      </View>
      <BottomSheetTextInput
        value={asset.label}
        onChangeText={onChangeLabel}
        placeholder="Label (optional) e.g. Meter location"
        placeholderTextColor={colors.muted}
        style={[styles.pendingNameInput, { color: colors.text, borderColor: colors.border }]}
      />
      <Pressable onPress={onRemove} hitSlop={8}>
        <X size={16} color={colors.red} />
      </Pressable>
    </View>
  );
}

function EvidenceAction({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Camera;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon size={18} color={colors.primary} />
      <Text style={[styles.actionText, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    ...typography.bodyMedium,
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
  },
  addButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  addButtonText: {
    ...typography.label,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  actionText: {
    ...typography.label,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  pendingThumb: {
    width: 44,
    height: 44,
  },
  pendingNameInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    ...typography.label,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmSecondary: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
  },
  confirmPrimary: {
    flex: 1.4,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  confirmPrimaryText: {
    color: '#FFFFFF',
  },
  fileList: {
    gap: spacing.sm,
  },
  fileItem: {
    minHeight: 84,
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  thumb: {
    width: 56,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  fileCopy: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  fileName: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 17,
  },
  fileActions: {
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  previewBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
    padding: spacing.xl,
  },
  previewCard: {
    width: '100%',
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 320,
  },
  previewName: {
    ...typography.caption,
    textAlign: 'center',
  },
});
