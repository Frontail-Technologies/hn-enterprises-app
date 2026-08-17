import { Image } from 'expo-image';
import { Eye, FileText, Image as ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { isImageFile } from '@/components/shared/EvidenceUploader';
import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { CustomerRecord, EvidenceFile } from '@/services/mockData';
import { formatDate } from '@/utils/format';

export function useDocumentsPanel(customer: CustomerRecord) {
  const surveyPhotos = customer.survey.evidence ?? [];
  const giPhotos = customer.giMeasurements.evidence ?? [];
  const isolationPhotos = customer.isolationFittings.evidence ?? [];
  const fittingsPhotos = customer.fittingsAccessories?.evidence ?? [];
  const civilPhotos = customer.lmcPipelineWork.civilEvidence ?? [];
  const lmcEvidence = customer.lmcPipelineWork.pipeRecords.flatMap((pipe) => pipe.evidence);
  const meterPhotos = customer.commissioningConversion.evidence ?? [];
  const billingPhotos = customer.billingCompletion.evidence ?? [];

  const content = (
    <>
      <MediaSection title="Survey Photos" files={surveyPhotos} uploadedOn={customer.survey.surveyDate} />
      <MediaSection title="GI Measurement Photos" files={giPhotos} uploadedOn={customer.createdDate} />
      <MediaSection title="Isolation / Regulator Photos" files={isolationPhotos} uploadedOn={customer.createdDate} />
      <MediaSection title="Fittings & Accessories Photos" files={fittingsPhotos} uploadedOn={customer.createdDate} />
      <MediaSection title="LMC Civil Work Photos" files={civilPhotos} uploadedOn={customer.createdDate} />
      <MediaSection title="LMC Pipe Evidence" files={lmcEvidence} uploadedOn={customer.createdDate} />
      <MediaSection title="Meter Photo" files={meterPhotos} uploadedOn={customer.commissioningConversion.installationDate} />
      <MediaSection title="JMR / Billing Evidence" files={billingPhotos} uploadedOn={customer.createdDate} />
      <DocumentSection customer={customer} />
    </>
  );

  return { content, footer: undefined };
}

function MediaSection({ title, files, uploadedOn }: { title: string; files: EvidenceFile[]; uploadedOn: string }) {
  const { colors } = useTheme();
  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);

  return (
    <Card style={styles.mediaCard}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title} ({files.length})
        </Text>
      </View>
      {files.length ? (
        <>
          <View style={styles.thumbnailRow}>
            {files.map((file) => (
              <Pressable
                key={file.id}
                onPress={() => setPreviewFile(file)}
                style={[styles.thumbnail, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
              >
                {isImageFile(file) && file.uri ? (
                  <Image source={{ uri: file.uri }} style={styles.thumbnailImage} contentFit="cover" />
                ) : (
                  <ImageIcon size={24} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>
          <View style={styles.uploadLine}>
            <Text style={[typography.caption, { color: colors.muted }]}>Uploaded on {formatDate(uploadedOn)}</Text>
            <View style={styles.uploadBadge}>
              <Text style={styles.uploadBadgeText}>Uploaded</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={[typography.label, { color: colors.muted }]}>No files uploaded.</Text>
      )}

      <Modal visible={Boolean(previewFile)} transparent animationType="fade" onRequestClose={() => setPreviewFile(null)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewFile(null)}>
          <View style={[styles.previewCard, { backgroundColor: colors.card }]}>
            {previewFile?.uri && isImageFile(previewFile) ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} contentFit="contain" />
            ) : (
              <FileText size={52} color={colors.primary} />
            )}
            <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
              {previewFile?.fileName}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </Card>
  );
}

function DocumentSection({ customer }: { customer: CustomerRecord }) {
  const { colors } = useTheme();

  return (
    <Card style={styles.mediaCard}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Documents & PDFs ({customer.documents.length})
        </Text>
      </View>
      {customer.documents.length ? (
        customer.documents.map((document) => (
          <View key={document.id} style={[styles.documentRow, { borderColor: colors.border }]}>
            <View style={[styles.documentIcon, { backgroundColor: colors.softOrange }]}>
              <FileText size={17} color={colors.primary} />
            </View>
            <View style={styles.documentCopy}>
              <Text style={[styles.documentTitle, { color: colors.text }]} numberOfLines={1}>
                {document.fileName}
              </Text>
              <Text style={[typography.caption, { color: colors.muted }]}>Uploaded on {formatDate(customer.createdDate)}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.muted }]}>180 KB</Text>
            <View style={[styles.previewButton, { borderColor: colors.border }]}>
              <Eye size={15} color={colors.accent} />
            </View>
          </View>
        ))
      ) : (
        <Text style={[typography.label, { color: colors.muted }]}>No documents uploaded.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  mediaCard: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  viewAll: {
    ...typography.caption,
    fontSize: 10,
  },
  thumbnailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumbnail: {
    width: 72,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
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
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  moreText: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    fontSize: 15,
  },
  uploadLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  uploadBadge: {
    borderRadius: radius.sm,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  uploadBadgeText: {
    ...typography.caption,
    color: '#15803D',
    fontSize: 9,
    lineHeight: 12,
  },
  documentRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  documentIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  documentCopy: {
    flex: 1,
    gap: 1,
  },
  documentTitle: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 15,
  },
  previewButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
