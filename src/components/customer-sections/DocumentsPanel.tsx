import { Eye, FileText, Image as ImageIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { CustomerRecord, EvidenceFile } from '@/services/mockData';
import { formatDate } from '@/utils/format';

export function useDocumentsPanel(customer: CustomerRecord) {
  const surveyPhotos = customer.survey.evidence ?? [];
  const lmcEvidence = customer.lmcPipelineWork.pipeRecords.flatMap((pipe) => pipe.evidence);
  const meterPhotos = customer.commissioningConversion.evidence ?? [];

  const content = (
    <>
      <MediaSection title="Survey Photos" files={surveyPhotos} uploadedOn={customer.survey.surveyDate} />
      <MediaSection title="LMC Evidence" files={lmcEvidence} uploadedOn={customer.createdDate} />
      <MediaSection title="Meter Photo" files={meterPhotos} uploadedOn={customer.commissioningConversion.installationDate} />
      <DocumentSection customer={customer} />
    </>
  );

  return { content, footer: undefined };
}

function MediaSection({ title, files, uploadedOn }: { title: string; files: EvidenceFile[]; uploadedOn: string }) {
  const { colors } = useTheme();
  const visibleFiles = files.slice(0, 3);
  const hiddenCount = Math.max(files.length - visibleFiles.length, 0);

  return (
    <Card style={styles.mediaCard}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title} ({files.length})
        </Text>
        {files.length > 3 ? <Text style={[styles.viewAll, { color: colors.accent }]}>View All</Text> : null}
      </View>
      {files.length ? (
        <>
          <View style={styles.thumbnailRow}>
            {visibleFiles.map((file, index) => (
              <View key={file.id} style={[styles.thumbnail, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ImageIcon size={24} color={colors.primary} />
                {index === visibleFiles.length - 1 && hiddenCount ? (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreText}>+{hiddenCount}</Text>
                  </View>
                ) : null}
              </View>
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
        {customer.documents.length > 3 ? <Text style={[styles.viewAll, { color: colors.accent }]}>View All</Text> : null}
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
    gap: spacing.md,
    padding: spacing.md,
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
