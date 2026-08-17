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
import { useUpdateComplaintMutation, useCreateComplaintMutation } from '@/queries';
import type { ComplaintRecord, ComplaintStatus, ComplaintPriority } from '@/services/complaints.service';

type ComplaintUpdateSheetProps = {
  complaint?: ComplaintRecord | null;
  visible?: boolean;
  preselectedCustomerId?: string;
  onClose: () => void;
};

export function ComplaintUpdateSheet({ complaint, visible, preselectedCustomerId, onClose }: ComplaintUpdateSheetProps) {
  const isVisible = visible !== undefined ? visible : Boolean(complaint);
  return (
    <Sheet visible={isVisible} onClose={onClose} title={complaint ? "Update Complaint" : "Raise Complaint"}>
      {complaint ? (
        <ComplaintUpdateForm key={complaint.id} complaint={complaint} onClose={onClose} />
      ) : preselectedCustomerId && isVisible ? (
        <ComplaintCreateForm customerId={preselectedCustomerId} onClose={onClose} />
      ) : null}
    </Sheet>
  );
}

const complaintPriorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

function ComplaintCreateForm({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [priorityOpen, setPriorityOpen] = useState(false);
  const createMutation = useCreateComplaintMutation();

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }
    try {
      await createMutation.mutateAsync({ customerId, title, description, priority });
      showToast('Complaint raised', 'success');
      onClose();
    } catch (error: any) { showToast(error?.message || 'Unable to raise complaint', "error"); }
  };

  return (
    <View style={styles.content}>
      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Enter complaint title..."
      />

      <SimpleSelect
        label="Priority"
        value={priority}
        options={complaintPriorityOptions}
        open={priorityOpen}
        onOpenChange={setPriorityOpen}
        onChange={(val) => setPriority(val as ComplaintPriority)}
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Enter details..."
        multiline
      />

      <Button label="Save" onPress={() => void handleSave()} loading={createMutation.isPending} />
    </View>
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
    } catch (error: any) { showToast(error?.message || 'Unable to update complaint', "error"); }
  };

  return (
    <View style={styles.content}>
      <View style={[styles.reference, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
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
