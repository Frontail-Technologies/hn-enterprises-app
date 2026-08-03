import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { complaintStatusOptions } from '@/constants/complaints';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useUpdateComplaintMutation } from '@/queries';
import type { ComplaintRecord, ComplaintStatus } from '@/services/complaints.service';

type ComplaintUpdateSheetProps = {
  complaint: ComplaintRecord | null;
  onClose: () => void;
};

export function ComplaintUpdateSheet({ complaint, onClose }: ComplaintUpdateSheetProps) {
  return (
    <Sheet visible={Boolean(complaint)} onClose={onClose} title="Complaint">
      {complaint ? <ComplaintUpdateForm key={complaint.id} complaint={complaint} onClose={onClose} /> : null}
    </Sheet>
  );
}

function ComplaintUpdateForm({ complaint, onClose }: { complaint: ComplaintRecord; onClose: () => void }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const [remark, setRemark] = useState(complaint.supervisorRemark);
  const updateMutation = useUpdateComplaintMutation();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: complaint.id, status, supervisorRemark: remark.trim() || undefined });
      showToast('Complaint updated', 'success');
      onClose();
    } catch {
      showToast('Unable to update complaint', 'error');
    }
  };

  return (
    <View style={styles.content}>
      <View style={[styles.reference, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{complaint.title}</Text>
        <Text style={[typography.caption, { color: colors.muted }]}>{complaint.customerName}</Text>
        <Text style={[typography.body, { color: colors.text }]}>{complaint.description}</Text>
      </View>

      <SimpleSelect
        label="Status"
        value={status}
        options={complaintStatusOptions}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onChange={setStatus}
      />

      <Input
        label="Resolution Remark"
        value={remark}
        onChangeText={setRemark}
        placeholder="Add a remark..."
        multiline
      />

      <Button label="Save" onPress={() => void handleSave()} loading={updateMutation.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  reference: {
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
});
