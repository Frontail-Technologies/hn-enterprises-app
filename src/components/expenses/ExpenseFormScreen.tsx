import { useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EvidenceUploader } from '@/components/shared/EvidenceUploader';
import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { StickyFooter } from '@/components/shared/StickyFooter';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { DateField } from '@/components/ui/DateField';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormRow } from '@/components/ui/FormRow';
import { FullScreenForm, type FullScreenFormHandle } from '@/components/ui/FullScreenForm';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useExpenseForm, type ExpenseFieldKey } from '@/hooks/useExpenseForm';

export function ExpenseFormScreen({ expenseId }: { expenseId?: string }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const {
    draft,
    errors,
    updateDraft,
    save,
    isEdit,
    isSaving,
    dirty,
    loading,
    loadError,
    notFound,
    refetchDetail,
    plumberOptions,
    plumbersLoading,
    plumbersError,
    refetchPlumbers,
    paymentModeOptions,
    modesLoading,
    modesError,
    refetchModes,
    categoryOptions,
    statusOptions,
  } = useExpenseForm(expenseId);

  const formRef = useRef<FullScreenFormHandle>(null);
  const fieldY = useRef<Record<ExpenseFieldKey, number>>({ purpose: 0, amount: 0 });
  const allowLeaveRef = useRef(false);
  const pendingActionRef = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [plumberOpen, setPlumberOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !(dirty || isSaving) });
  }, [navigation, dirty, isSaving]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeaveRef.current) return;
      if (isSaving) {
        event.preventDefault();
        return;
      }
      if (!dirty) return;
      event.preventDefault();
      pendingActionRef.current = event.data.action;
      setDiscardOpen(true);
    });
    return unsubscribe;
  }, [navigation, dirty, isSaving]);

  const confirmDiscard = () => {
    setDiscardOpen(false);
    allowLeaveRef.current = true;
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) navigation.dispatch(action);
    else navigation.goBack();
  };

  const handleSave = async () => {
    const result = await save();
    if (result.ok) {
      allowLeaveRef.current = true;
      navigation.goBack();
      return;
    }
    if (result.firstInvalid) {
      formRef.current?.scrollTo(fieldY.current[result.firstInvalid]);
    }
  };

  const showForm = !loading && !loadError && !notFound;
  const footer = showForm ? (
    <StickyFooter>
      <Button label={isEdit ? 'Save Expense' : 'Add Expense'} loading={isSaving} onPress={handleSave} />
    </StickyFooter>
  ) : undefined;

  return (
    <FullScreenForm
      ref={formRef}
      title={isEdit ? 'Edit Expense' : 'Add Expense'}
      onBack={() => navigation.goBack()}
      footer={footer}
    >
      {loading ? (
        <View style={styles.skeleton}>
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} height={48} borderRadius={radius.input} />
          ))}
        </View>
      ) : loadError ? (
        <ErrorState
          title="Couldn't load this expense"
          description="Check your connection and try again."
          onRetry={() => refetchDetail()}
        />
      ) : notFound ? (
        <View style={styles.notFound}>
          <Text style={[typography.h2, { color: colors.text, textAlign: 'center' }]}>Expense not found</Text>
          <Text style={[typography.caption, { color: colors.muted, textAlign: 'center' }]}>
            This expense no longer exists.
          </Text>
        </View>
      ) : (
        <>
          <FormRow>
            <SimpleSelect
              label="Category"
              value={draft.category}
              options={categoryOptions}
              open={categoryOpen}
              onOpenChange={setCategoryOpen}
              onChange={(value) => updateDraft('category', value)}
            />
            {draft.category === 'plumber_payment' ? (
              <SimpleSelect
                label="Select Plumber"
                value={draft.plumberId}
                options={plumberOptions}
                open={plumberOpen}
                onOpenChange={setPlumberOpen}
                onChange={(value) => updateDraft('plumberId', value)}
                searchable
                loading={plumbersLoading}
                error={plumbersError}
                onRetry={() => refetchPlumbers()}
                emptyLabel="No plumbers available"
              />
            ) : (
              <Input
                label="Paid To / Shop"
                value={draft.paidTo}
                onChangeText={(value) => updateDraft('paidTo', value)}
                placeholder="Vendor or person name"
              />
            )}
          </FormRow>

          <View onLayout={(event) => (fieldY.current.purpose = event.nativeEvent.layout.y)}>
            <Input
              label="Purpose / What Bought"
              value={draft.purpose}
              onChangeText={(value) => updateDraft('purpose', value)}
              placeholder="Pipe clamp purchase"
              error={errors.purpose}
            />
          </View>

          <Input
            label="Site Address"
            value={draft.address}
            onChangeText={(value) => updateDraft('address', value)}
            placeholder="Site or work address"
          />

          <View onLayout={(event) => (fieldY.current.amount = event.nativeEvent.layout.y)}>
            <Input
              label="Amount"
              value={draft.amount}
              onChangeText={(value) => updateDraft('amount', value)}
              keyboardType="numeric"
              placeholder="0"
              error={errors.amount}
            />
          </View>

          <FormRow>
            <DateField label="Expense Date" value={draft.date} onChangeText={(value) => updateDraft('date', value)} />
            <SimpleSelect
              label="Payment Mode"
              value={draft.paymentMode}
              options={paymentModeOptions}
              open={modeOpen}
              onOpenChange={setModeOpen}
              onChange={(value) => updateDraft('paymentMode', value)}
              loading={modesLoading}
              error={modesError}
              onRetry={() => refetchModes()}
              emptyLabel="No payment modes available"
            />
          </FormRow>

          <SimpleSelect
            label="Status"
            value={draft.status}
            options={statusOptions}
            open={statusOpen}
            onOpenChange={setStatusOpen}
            onChange={(value) => updateDraft('status', value)}
          />

          <Input
            label="Remarks (Optional)"
            value={draft.remarks}
            onChangeText={(value) => updateDraft('remarks', value)}
            placeholder="Any additional notes"
            multiline
          />

          <EvidenceUploader
            title="Receipt / Proof"
            initialFiles={draft.evidence}
            module="expenses"
            recordId={expenseId ?? undefined}
            onChange={(files) => updateDraft('evidence', files)}
            deferUpload
          />

          <View style={styles.spacer} />
        </>
      )}

      <ConfirmSheet
        visible={discardOpen}
        title="Discard unsaved changes?"
        message="Your changes to this expense will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        onConfirm={confirmDiscard}
        onCancel={() => {
          pendingActionRef.current = null;
          setDiscardOpen(false);
        }}
      />
    </FullScreenForm>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  notFound: {
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  spacer: {
    height: spacing.sm,
  },
});
