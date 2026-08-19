import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePipeEditForm } from '@/components/customer-sections/LmcPipeEditForm';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import type { CustomerRecord, LmcPipeRecord } from '@/types/customers';
import { formatDate } from '@/utils/format';

export function useLmcPipelinePanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { colors } = useTheme();
  const [editingPipeId, setEditingPipeId] = useState<string | null>(null);

  const pipeForm = usePipeEditForm(customer, editingPipeId ?? '', () => setEditingPipeId(null), onRefetch);

  const content = (
    <>
      <View style={styles.pipeList}>
        {customer.lmcPipelineWork.pipeRecords.map((pipe) => (
          <Pressable
            key={pipe.id}
            onPress={() => setEditingPipeId(pipe.id)}
            style={({ pressed }) => [
              styles.pipeCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.84 },
            ]}
          >
            <View style={styles.pipeMain}>
              <View style={styles.pipeLeft}>
                <Text style={[styles.pipeTitle, { color: colors.accent }]}>{pipe.pipeSize}</Text>
                <Text style={[styles.pipeLength, { color: colors.text }]}>Length: {pipe.lengthMetres || '0'} m</Text>
              </View>
              <View style={styles.pipeDates}>
                <PipeDateRow label="Laying" value={pipe.layingDate} />
                <PipeDateRow label="Testing" value={pipe.testingDate} />
                <PipeDateRow label="Purging" value={pipe.purgingDate} />
              </View>
              <View style={styles.pipeActions}>
                <PipeStatusPill pipe={pipe} />
                <View style={[styles.editButton, { borderColor: colors.border }]}>
                  <Pencil size={15} color={colors.accent} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <Sheet
        visible={Boolean(editingPipeId)}
        onClose={() => setEditingPipeId(null)}
        title={pipeForm.pipe ? `${pipeForm.pipe.pipeSize} Pipe` : 'Pipe'}
        footer={pipeForm.footer}
      >
        {pipeForm.content}
      </Sheet>
    </>
  );

  return { content, footer: undefined };
}

function PipeDateRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.dateRow}>
      <Text style={[styles.dateLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: colors.muted }]}>{formatDate(value)}</Text>
    </View>
  );
}

function PipeStatusPill({ pipe }: { pipe: LmcPipeRecord }) {
  const { colors } = useTheme();
  const status = getPipeDisplayStatus(pipe);
  const tone = getPipeTone(status, colors);

  return (
    <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
      <Text style={[styles.statusText, { color: tone.color }]}>{status}</Text>
    </View>
  );
}

function getPipeDisplayStatus(pipe: LmcPipeRecord) {
  if (
    pipe.layingStatus === 'Not Required' &&
    pipe.testingStatus === 'Not Required' &&
    pipe.purgingStatus === 'Not Required'
  ) {
    return 'Not Required';
  }
  if (pipe.purgingStatus === 'Completed') return 'Completed';
  if (pipe.testingStatus === 'Passed') return 'Testing Done';
  if (pipe.layingStatus === 'Completed') return 'Laying';
  if (pipe.layingStatus === 'In Progress') return 'In Progress';
  return 'Pending';
}

function getPipeTone(status: string, colors: ReturnType<typeof useTheme>['colors']) {
  if (status === 'Completed') return { color: colors.green, background: '#DCFCE7' };
  if (status === 'In Progress' || status === 'Testing Done') return { color: colors.accent, background: colors.softBlue };
  if (status === 'Laying' || status === 'Pending') return { color: colors.primary, background: colors.softOrange };
  return { color: colors.muted, background: '#F1F5F9' };
}

const styles = StyleSheet.create({
  pipeList: {
    gap: spacing.sm,
  },
  pipeCard: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  pipeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pipeLeft: {
    width: 76,
    gap: 8,
  },
  pipeTitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  pipeLength: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
  },
  pipeDates: {
    flex: 1,
    gap: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateLabel: {
    ...typography.caption,
    width: 45,
    fontSize: 9,
    lineHeight: 12,
  },
  dateValue: {
    ...typography.caption,
    flex: 1,
    fontSize: 9,
    lineHeight: 12,
  },
  pipeActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    ...typography.caption,
    fontSize: 8,
    lineHeight: 11,
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
});
