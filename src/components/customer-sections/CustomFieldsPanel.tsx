import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { FormStateBanner } from '@/components/shared/FormStateBanner';
import { SectionFormFooter } from '@/components/shared/SectionFormFooter';
import { Card } from '@/components/ui/Card';
import { DateField } from '@/components/ui/DateField';
import { Input } from '@/components/ui/Input';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useDraftForm } from '@/hooks/useDraftForm';
import { useCustomFieldDefinitionsQuery, useUpdateCustomFieldsMutation } from '@/queries';
import { normalizeError } from '@/utils/normalizeError';
import type { CustomFieldDefinition } from '@/services/masters.service';
import type { CustomerRecord } from '@/services/mockData';

const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
];

function groupAnchorKey(groupName: string) {
  return `custom-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
}

// One tab per dynamic field group (mirroring the web dashboard), not a single
// combined "Custom Fields" tab - so this returns an array of tab descriptors
// (empty when the supervisor has no visible groups) instead of one panel.
export function useCustomFieldsPanel(customer: CustomerRecord, onRefetch?: () => Promise<void>) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data: definitions = [] } = useCustomFieldDefinitionsQuery();
  const updateCustomFieldsMutation = useUpdateCustomFieldsMutation(customer.id);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  const { values, updateField, clearDraft, draftState } = useDraftForm(
    `customer:${customer.id}:custom-fields`,
    customer.customFields ?? {},
  );

  const groups = useMemo(() => {
    const visible = definitions.filter((field) => isAdmin || field.supervisorAccess !== 'admin_only');
    const byGroup = new Map<string, CustomFieldDefinition[]>();
    for (const field of visible) {
      const list = byGroup.get(field.groupName) ?? [];
      list.push(field);
      byGroup.set(field.groupName, list);
    }
    for (const list of byGroup.values()) {
      list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return Array.from(byGroup.entries());
  }, [definitions, isAdmin]);

  const submit = async () => {
    try {
      await updateCustomFieldsMutation.mutateAsync(values);
      await clearDraft();
      await onRefetch?.();
      showToast('Custom fields submitted', 'success');
      router.back();
    } catch (error) {
      console.error('[CustomFieldsPanel] submit failed', { customerId: customer.id, error });
      const message = normalizeError(error, 'Unable to submit custom fields');
      showToast(message, 'error');
    }
  };

  const footer = <SectionFormFooter onSubmit={submit} isSubmitting={updateCustomFieldsMutation.isPending} />;

  return groups.map(([groupName, fields]) => ({
    key: groupAnchorKey(groupName),
    label: groupName,
    panel: {
      content: (
        <>
          <FormStateBanner state={draftState} />
          <Card style={styles.formCard}>
            {fields.map((field) => (
              <CustomFieldInput
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(value) => updateField(field.key, value)}
                open={openDropdownKey === field.key}
                onOpenChange={(open) => setOpenDropdownKey(open ? field.key : null)}
                readOnly={!isAdmin && field.supervisorAccess === 'supervisor_view'}
              />
            ))}
          </Card>
        </>
      ),
      footer,
    },
  }));
}

function CustomFieldInput({
  field,
  value,
  onChange,
  open,
  onOpenChange,
  readOnly = false,
}: {
  field: CustomFieldDefinition;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}) {
  if (field.valueType === 'dropdown') {
    const stringValue = typeof value === 'string' ? value : '';
    return (
      <SimpleSelect
        label={field.label}
        value={stringValue}
        options={field.dropdownOptions.map((option) => ({ label: option, value: option }))}
        open={open}
        onOpenChange={onOpenChange}
        onChange={onChange}
        searchable={field.dropdownOptions.length > 6}
        disabled={readOnly}
      />
    );
  }

  if (field.valueType === 'yes_no') {
    return (
      <SimpleSelect
        label={field.label}
        value={value === true ? 'Yes' : value === false ? 'No' : ''}
        options={YES_NO_OPTIONS}
        open={open}
        onOpenChange={onOpenChange}
        onChange={(next) => onChange(next === 'Yes')}
        disabled={readOnly}
      />
    );
  }

  if (field.valueType === 'date') {
    return (
      <DateField
        label={field.label}
        value={typeof value === 'string' ? value : ''}
        onChangeText={(next) => onChange(next)}
        editable={!readOnly}
      />
    );
  }

  return (
    <Input
      label={field.label}
      value={typeof value === 'string' ? value : ''}
      onChangeText={(next) => onChange(next)}
      keyboardType={field.valueType === 'number' || field.valueType === 'amount' ? 'decimal-pad' : 'default'}
      editable={!readOnly}
    />
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
});
