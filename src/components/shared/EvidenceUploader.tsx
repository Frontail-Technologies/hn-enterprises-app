import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, FileText, ImageIcon, MapPin, Plus, RefreshCcw, RotateCcw, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import type { EvidenceFile } from '@/services/mockData';
import { resolveMediaUrl, uploadFile, type UploadAsset } from '@/services/uploads.service';

type EvidenceUploaderProps = {
  title?: string;
  initialFiles?: EvidenceFile[];
  module: string;
  recordId?: string;
  onChange?: (files: EvidenceFile[]) => void;
  readOnly?: boolean;
};

type PendingAsset = {
  uri: string;
  fileName: string;
  mimeType?: string;
  assetId?: string | null;
};

export function EvidenceUploader({
  title = 'Evidence Photos',
  initialFiles = [],
  module,
  recordId,
  onChange,
  readOnly = false,
}: EvidenceUploaderProps) {
  const { colors } = useTheme();
  const { location, captureLocation } = useCurrentLocation();
  const [files, setFiles] = useState<EvidenceFile[]>(initialFiles);
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([]);

  const openSheet = () => {
    setPendingAssets([]);
    setSheetOpen(true);
  };
  const closeSheet = () => {
    setSheetOpen(false);
    setPendingAssets([]);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    queuePending(result.assets, 'camera');
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled) return;
    queuePending(result.assets, 'gallery');
  };

  const pickFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    setPendingAssets((current) => [
      ...current,
      ...result.assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.name,
        mimeType: asset.mimeType,
      })),
    ]);
  };

  const queuePending = (assets: ImagePicker.ImagePickerAsset[], source: 'camera' | 'gallery') => {
    setPendingAssets((current) => [
      ...current,
      ...assets.map((asset) => ({
        uri: asset.uri,
        fileName: asset.fileName ?? `${source}-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        assetId: asset.assetId,
      })),
    ]);
  };

  const updatePendingName = (index: number, name: string) => {
    setPendingAssets((current) => current.map((asset, i) => (i === index ? { ...asset, fileName: name } : asset)));
  };

  const removePending = (index: number) => {
    setPendingAssets((current) => current.filter((_, i) => i !== index));
  };

  const updateFiles = (updater: (current: EvidenceFile[]) => EvidenceFile[]) => {
    setFiles((current) => {
      const next = updater(current);
      onChange?.(next);
      return next;
    });
  };

  const runUpload = async (id: string, asset: UploadAsset) => {
    try {
      const uploaded = await uploadFile(asset, module, recordId);
      updateFiles((current) =>
        current.map((file) =>
          file.id === id
            ? {
                ...file,
                uri: resolveMediaUrl(uploaded.url) ?? uploaded.url,
                fileUrl: uploaded.url,
                fileName: uploaded.fileName,
                status: 'Uploaded',
              }
            : file,
        ),
      );
    } catch {
      updateFiles((current) => current.map((file) => (file.id === id ? { ...file, status: 'Failed' } : file)));
    }
  };

  const confirmPending = () => {
    const capturedAt = new Date().toISOString();
    const gpsLocation = location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : undefined;
    const staged: EvidenceFile[] = pendingAssets.map((asset) => ({
      id: `${asset.assetId ?? asset.uri}-${Date.now()}`,
      fileName: asset.fileName,
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      status: 'Uploading' as const,
      capturedAt,
      gpsLocation,
    }));

    updateFiles((current) => [...current, ...staged]);
    closeSheet();

    staged.forEach((file) => {
      void runUpload(file.id, { uri: file.uri!, fileName: file.fileName, mimeType: file.mimeType });
    });
  };

  const removeFile = (id: string) => {
    updateFiles((current) => current.filter((file) => file.id !== id));
  };

  const replaceFile = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    updateFiles((current) =>
      current.map((file) =>
        file.id === id
          ? {
              ...file,
              uri: asset.uri,
              mimeType,
              status: 'Uploading',
              capturedAt: new Date().toISOString(),
            }
          : file,
      ),
    );

    const existingFileName = files.find((file) => file.id === id)?.fileName;
    const fileName = existingFileName ?? `replacement-${id}.jpg`;
    void runUpload(id, { uri: asset.uri, fileName, mimeType });
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
          {files.map((file) => {
            const isImage = Boolean(file.mimeType?.startsWith('image/') || file.uri?.match(/\.(jpg|jpeg|png|webp)$/i));

            return (
              <View key={file.id} style={[styles.fileItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Pressable onPress={() => setPreviewFile(file)} style={[styles.thumb, { backgroundColor: colors.background }]}>
                  {isImage && file.uri ? (
                    <Image source={{ uri: file.uri }} style={styles.thumbImage} contentFit="cover" />
                  ) : (
                    <FileText size={22} color={colors.primary} />
                  )}
                </Pressable>
                <View style={styles.fileCopy}>
                  <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                    {file.fileName}
                  </Text>
                  <Text style={[typography.label, { color: colors.muted }]}>
                    {file.status ?? 'Uploaded'} : {file.capturedAt ? new Date(file.capturedAt).toLocaleString() : '-'}
                  </Text>
                  {file.gpsLocation ? (
                    <Text style={[typography.label, { color: colors.muted }]}>GPS: {file.gpsLocation}</Text>
                  ) : null}
                </View>
                {readOnly ? null : (
                  <View style={styles.fileActions}>
                    <Pressable onPress={() => replaceFile(file.id)}>
                      <RefreshCcw size={16} color={colors.primary} />
                    </Pressable>
                    {file.status === 'Failed' ? (
                      <Pressable onPress={() => retryFile(file.id)}>
                        <RotateCcw size={16} color={colors.red} />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => removeFile(file.id)}>
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
            <Pressable onPress={captureLocation} style={[styles.gpsButton, { borderColor: colors.border }]}>
              <MapPin size={14} color={location ? colors.green : colors.muted} />
              <Text style={[styles.gpsText, { color: location ? colors.green : colors.muted }]}>
                {location ? 'GPS added to next upload' : 'Tag current location'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[typography.label, { color: colors.muted }]}>Name each file before adding</Text>
            {pendingAssets.map((asset, index) => (
              <PendingAssetRow
                key={`${asset.uri}-${index}`}
                asset={asset}
                onChangeName={(value) => updatePendingName(index, value)}
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
              <Pressable onPress={confirmPending} style={[styles.confirmPrimary, { backgroundColor: colors.primary }]}>
                <Text style={[typography.label, styles.confirmPrimaryText]}>
                  Add {pendingAssets.length} file{pendingAssets.length === 1 ? '' : 's'}
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
            {previewFile?.uri && previewFile.mimeType?.startsWith('image/') ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} contentFit="contain" />
            ) : (
              <FileText size={52} color={colors.primary} />
            )}
            <Text style={[styles.previewName, { color: colors.text }]}>{previewFile?.fileName}</Text>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function PendingAssetRow({
  asset,
  onChangeName,
  onRemove,
}: {
  asset: PendingAsset;
  onChangeName: (value: string) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const { ref, onFocus } = useScrollIntoViewOnFocus();

  return (
    <View style={[styles.pendingRow, { borderColor: colors.border }]}>
      <View style={[styles.thumb, styles.pendingThumb, { backgroundColor: colors.background }]}>
        {asset.mimeType?.startsWith('image/') ? (
          <Image source={{ uri: asset.uri }} style={styles.thumbImage} contentFit="cover" />
        ) : (
          <FileText size={20} color={colors.primary} />
        )}
      </View>
      <TextInput
        ref={ref}
        onFocus={onFocus}
        value={asset.fileName}
        onChangeText={onChangeName}
        placeholder="Document name"
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
    minHeight: 42,
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
  gpsButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  gpsText: {
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
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
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
    ...typography.caption,
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
