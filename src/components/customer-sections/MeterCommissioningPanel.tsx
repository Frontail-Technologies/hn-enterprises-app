import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { EvidenceUploader } from "@/components/shared/EvidenceUploader";
import { FormStateBanner } from "@/components/shared/FormStateBanner";
import { InlineFieldError } from "@/components/ui/InlineFieldError";
import { MeterReadingInput } from "@/components/shared/MeterReadingInput";
import { RequiredLabel } from "@/components/shared/RequiredLabel";
import { SectionBodySkeleton } from "@/components/shared/SectionBodySkeleton";
import { SectionFormFooter } from "@/components/shared/SectionFormFooter";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Card } from "@/components/ui/Card";
import { DateField } from "@/components/ui/DateField";
import { Input } from "@/components/ui/Input";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useDraftForm } from "@/hooks/useDraftForm";
import {
  useMasterValuesQuery,
  useUpdateCommissioningConversionMutation,
} from "@/queries";
import { useScrollIntoViewOnFocus } from "@/hooks/useScrollIntoViewOnFocus";
import { isEvidenceDirty } from "@/utils/evidenceSnapshot";
import { normalizeError } from "@/utils/normalizeError";
import { getRequiredFieldErrors } from "@/utils/validateRequired";
import type { CustomerRecord } from "@/types/customers";
import type { EvidenceFile } from "@/types/evidence";

export function useMeterCommissioningPanel(
  customer: CustomerRecord,
  onRefetch?: () => Promise<void>,
) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const updateCommissioningMutation = useUpdateCommissioningConversionMutation(
    customer.id,
  );
  const [evidence, setEvidence] = useState<EvidenceFile[]>(
    customer.commissioningConversion?.evidence ?? [],
  );
  const [initialEvidence, setInitialEvidence] = useState<EvidenceFile[]>(
    customer.commissioningConversion?.evidence ?? [],
  );
  const meter = customer.commissioningConversion ?? {
    meterNo: "",
    installationDate: "",
    commissioningDate: "",
    conversionDate: "",
    regulatorPressure: "",
    regulatorNo: "",
    meterType: "",
    meterReading: "",
    nonConversionRemark: "",
    evidence: [],
  };
  const {
    values,
    updateField,
    clearDraft,
    draftState,
    loadingDraft,
    isDirty: valuesDirty,
  } = useDraftForm(`customer:${customer.id}:meter`, {
    ...meter,
    meterReading: meter.meterReading.replace(/\D/g, ""),
  });
  const isDirty = valuesDirty || isEvidenceDirty(evidence, initialEvidence);
  const { ref: remarkRef, onFocus: remarkOnFocus } = useScrollIntoViewOnFocus();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const required =
    customer.sectionCompletion?.commissioning.requiredFields ?? [];
  const { data: meterTypes = [] } = useMasterValuesQuery("Meter Types");
  const meterTypeOptions = useMemo(
    () => meterTypes.map((type) => ({ label: type, value: type })),
    [meterTypes],
  );
  const [meterTypeOpen, setMeterTypeOpen] = useState(false);

  const setField = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => {
    updateField(key, value);
    if (errors[key as string])
      setErrors((current) => ({ ...current, [key as string]: "" }));
  };

  const submit = async () => {
    if (!isDirty) return;

    const nextErrors = getRequiredFieldErrors(required, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      showToast("Please fill all required fields", "error");
      return;
    }
    try {
      const updated = await updateCommissioningMutation.mutateAsync({
        meterNo: values.meterNo,
        installationDate: values.installationDate,
        commissioningDate: values.commissioningDate,
        conversionDate: values.conversionDate,
        regulatorPressure: values.regulatorPressure,
        regulatorNo: values.regulatorNo,
        meterType: values.meterType,
        meterReading: values.meterReading,
        nonConversionRemark: values.nonConversionRemark,
        evidence,
        approvalStatus: "submitted",
      });
      setInitialEvidence(updated.commissioningConversion?.evidence ?? []);
      await clearDraft();
      await onRefetch?.();
      showToast("Meter & commissioning submitted", "success");
    } catch (error) {
      console.error("[MeterCommissioningPanel] submit failed", {
        customerId: customer.id,
        evidenceCount: evidence.length,
        error,
      });
      const message = normalizeError(
        error,
        "Unable to submit meter & commissioning",
      );
      showToast(message, "error");
    }
  };

  const content = loadingDraft ? (
    <SectionBodySkeleton />
  ) : (
    <>
      <FormStateBanner state={draftState} />

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Meter Details
        </Text>
        <Input
          label="Meter Number"
          required={required.includes("meterNo")}
          error={errors.meterNo}
          value={values.meterNo}
          onChangeText={(value) => setField("meterNo", value)}
        />
        <View style={styles.fieldGroup}>
          <SimpleSelect
            label="Meter Type"
            value={values.meterType}
            options={meterTypeOptions}
            open={meterTypeOpen}
            onOpenChange={setMeterTypeOpen}
            onChange={(value) => setField("meterType", value)}
            searchable
            emptyLabel="No meter types available"
          />
          <InlineFieldError message={errors.meterType} />
        </View>
        <Input
          label="Regulator Pressure"
          value={values.regulatorPressure}
          onChangeText={(value) => updateField("regulatorPressure", value)}
        />
        <Input
          label="Regulator Number"
          value={values.regulatorNo}
          onChangeText={(value) => updateField("regulatorNo", value)}
        />
        <View style={styles.fieldGroup}>
          <RequiredLabel
            label="Meter Reading"
            required={required.includes("meterReading")}
          />
          <MeterReadingInput
            value={values.meterReading}
            error={errors.meterReading}
            onChangeText={(value) => setField("meterReading", value)}
          />
        </View>
      </Card>

      <Card style={styles.formCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Important Dates
        </Text>
        <DateField
          label="Installation Date"
          required={required.includes("installationDate")}
          error={errors.installationDate}
          value={values.installationDate}
          onChangeText={(value) => setField("installationDate", value)}
        />
        <DateField
          label="Commissioning Date"
          required={required.includes("commissioningDate")}
          error={errors.commissioningDate}
          value={values.commissioningDate}
          onChangeText={(value) => setField("commissioningDate", value)}
        />
        <DateField
          label="Conversion Date"
          required={required.includes("conversionDate")}
          error={errors.conversionDate}
          value={values.conversionDate}
          onChangeText={(value) => setField("conversionDate", value)}
        />
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <RequiredLabel label="Non-Conversion Remark" />
          <TextInput
            ref={remarkRef}
            onFocus={remarkOnFocus}
            value={values.nonConversionRemark}
            onChangeText={(value) => updateField("nonConversionRemark", value)}
            multiline
            placeholder="Add non-conversion remark..."
            placeholderTextColor={colors.muted}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            textAlignVertical="top"
          />
        </View>
        <EvidenceUploader
          title="Meter Photo / Installation Photos"
          initialFiles={meter.evidence}
          module="customers"
          recordId={customer.id}
          onChange={setEvidence}
          deferUpload
        />
      </Card>
    </>
  );

  const footer = (
    <SectionFormFooter
      onSubmit={submit}
      isSubmitting={updateCommissioningMutation.isPending}
      disabled={!isDirty}
    />
  );

  return { content, footer };
}

const styles = StyleSheet.create({
  formCard: {
    gap: spacing.md,
    padding: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  textArea: {
    minHeight: 104,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.body,
  },
});
