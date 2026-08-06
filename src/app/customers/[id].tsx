import { useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Navigation, Phone, StickyNote } from "lucide-react-native";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";

import { useBillingRemarksPanel } from "@/components/customer-sections/BillingRemarksPanel";
import { useCustomerComplaintsPanel } from "@/components/customer-sections/CustomerComplaintsPanel";
import { useCustomerInfoPanel } from "@/components/customer-sections/CustomerInfoPanel";
import { useDocumentsPanel } from "@/components/customer-sections/DocumentsPanel";
import { useFittingsAccessoriesPanel } from "@/components/customer-sections/FittingsAccessoriesPanel";
import { useGiMeasurementsPanel } from "@/components/customer-sections/GiMeasurementsPanel";
import { useIsolationRegulatorsPanel } from "@/components/customer-sections/IsolationRegulatorsPanel";
import { useCivilWorkForm } from "@/components/customer-sections/LmcCivilWorkForm";
import { useLmcPipelinePanel } from "@/components/customer-sections/LmcPipelinePanel";
import { useMdpeFittingsPanel } from "@/components/customer-sections/MdpeFittingsPanel";
import { useMeterCommissioningPanel } from "@/components/customer-sections/MeterCommissioningPanel";
import { useSurveyPanel } from "@/components/customer-sections/SurveyPanel";
import { AppHeader } from "@/components/shared/AppHeader";
import { SectionTabBar } from "@/components/shared/SectionTabBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Sheet } from "@/components/ui/Sheet";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useCustomerRecord } from "@/hooks/useCustomerRecord";
import { useSwipeableTabs } from "@/hooks/useSwipeableTabs";
import { useCreateCustomerNoteMutation, useCustomerNotesQuery } from "@/queries";
import type { CustomerRecord } from "@/services/mockData";
import { formatDate, formatTime } from "@/utils/format";

export default function CustomerWorkspaceScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const { customer, isLoading, error, refetch } = useCustomerRecord(params.id);

  if (isLoading) {
    return (
      <Screen edges={["bottom"]} contentStyle={styles.screen}>
        <AppHeader title="Customer" left={<BackButton />} />
        <View style={[styles.emptyState, styles.loadingState]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !customer) {
    return (
      <Screen edges={["bottom"]} contentStyle={styles.screen}>
        <AppHeader title="Customer" left={<BackButton />} />
        <EmptyCustomer onRetry={refetch} />
      </Screen>
    );
  }

  return <CustomerWorkspaceContent customer={customer} onRefetch={refetch} />;
}

function CustomerWorkspaceContent({
  customer,
  onRefetch,
}: {
  customer: CustomerRecord;
  onRefetch: () => Promise<void>;
}) {
  const connection = customer.customerConnection;

  // Every technical section is now an inline tab panel. Hooks must be called
  // unconditionally regardless of which tab is active (Rules of Hooks).
  const customerInfoPanel = useCustomerInfoPanel(customer);
  const surveyPanel = useSurveyPanel(customer, onRefetch);
  const giPanel = useGiMeasurementsPanel(customer, onRefetch);
  const isolationPanel = useIsolationRegulatorsPanel(customer, onRefetch);
  const fittingsPanel = useFittingsAccessoriesPanel(customer, onRefetch);
  const lmcPanel = useLmcPipelinePanel(customer, onRefetch);
  const civilWorkPanel = useCivilWorkForm(customer, onRefetch);
  const mdpePanel = useMdpeFittingsPanel(customer, onRefetch);
  const meterPanel = useMeterCommissioningPanel(customer, onRefetch);
  const billingPanel = useBillingRemarksPanel(customer, onRefetch);
  const documentsPanel = useDocumentsPanel(customer);
  const complaintsPanel = useCustomerComplaintsPanel(customer);

  const tabs = [
    { key: "customer", label: "Customer", panel: customerInfoPanel },
    { key: "survey", label: "Survey", panel: surveyPanel },
    { key: "gi-measurements", label: "GI Measurements", panel: giPanel },
    {
      key: "isolation-regulators",
      label: "Isolation & Regulators",
      panel: isolationPanel,
    },
    {
      key: "fittings-accessories",
      label: "Fittings & Accessories",
      panel: fittingsPanel,
    },
    { key: "lmc", label: "LMC Pipeline", panel: lmcPanel },
    { key: "civil-work", label: "Civil Work", panel: civilWorkPanel },
    { key: "mdpe-fittings", label: "MDPE Fittings", panel: mdpePanel },
    {
      key: "meter-commissioning",
      label: "Meter & Commissioning",
      panel: meterPanel,
    },
    {
      key: "billing-remarks",
      label: "JMR / Billing Remarks",
      panel: billingPanel,
    },
    { key: "documents", label: "Photos / Documents", panel: documentsPanel },
    { key: "complaints", label: "Complaints", panel: complaintsPanel },
  ];

  // The set of tab keys never actually changes across renders (only each
  // tab's panel content/footer does), so this is safe to compute once and
  // reuse in the pager hook below without it churning every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tabKeys = useMemo(() => tabs.map((tab) => tab.key), []);

  const {
    activeKey: activeSection,
    pagerRef,
    initialIndex,
    onPageSelected,
    isMounted,
    selectTab: handleTabChange,
  } = useSwipeableTabs(tabKeys);

  const activeTab = tabs.find((tab) => tab.key === activeSection) ?? tabs[0];

  return (
    <Screen
      edges={["bottom"]}
      contentStyle={styles.screen}
      bottomAccessory={activeTab.panel.footer}
    >
      <View>
        <AppHeader
          title={connection.customerName}
          subtitle={`${connection.trBpNo} : ${customer.siteArea}`}
          left={<BackButton />}
          style={styles.header}
        />

        <SectionTabBar
          tabs={tabs.map((tab) => ({ key: tab.key, label: tab.label }))}
          activeKey={activeSection}
          onChange={handleTabChange}
        />
      </View>

      <PagerView ref={pagerRef} style={styles.pager} initialPage={initialIndex} onPageSelected={onPageSelected}>
        {tabs.map((tab) => (
          <View key={tab.key} style={styles.page}>
            {isMounted(tab.key) ? (
              <ScrollView
                style={styles.pageScroll}
                contentContainerStyle={styles.pageContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {tab.key === "customer" ? <CustomerQuickActions customer={customer} /> : null}
                {tab.panel.content}
              </ScrollView>
            ) : null}
          </View>
        ))}
      </PagerView>
    </Screen>
  );
}

function CustomerQuickActions({
  customer,
}: {
  customer: CustomerRecord;
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const connection = customer.customerConnection;
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const { data: notes = [], isLoading: notesLoading } = useCustomerNotesQuery(noteOpen ? customer.id : undefined);
  const createNoteMutation = useCreateCustomerNoteMutation(customer.id);

  const actions = [
    {
      label: "Add Note",
      icon: StickyNote,
      onPress: () => setNoteOpen(true),
    },
    {
      label: "Call Customer",
      icon: Phone,
      onPress: () => {
        if (connection.mobileNo) void Linking.openURL(`tel:${connection.mobileNo}`);
      },
    },
    {
      label: "Navigate",
      icon: Navigation,
      onPress: () => {
        const query = encodeURIComponent(`${connection.fullAddress}, ${customer.city}`);
        void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      },
    },
  ];

  return (
    <>
      <Card style={styles.quickCard}>
        <Text style={[styles.quickTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.quickAction,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <View style={[styles.quickIcon, { backgroundColor: colors.softBlue }]}>
                  <Icon size={17} color={colors.accent} />
                </View>
                <Text style={[styles.quickLabel, { color: colors.text }]} numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Sheet
        visible={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add Note"
        footer={
          <View style={[styles.noteFooter, { borderTopColor: colors.border }]}>
            <Button
              label="Cancel"
              variant="outline"
              onPress={() => setNoteOpen(false)}
              style={styles.noteFooterButton}
            />
            <Button
              label="Save Note"
              loading={createNoteMutation.isPending}
              onPress={async () => {
                try {
                  await createNoteMutation.mutateAsync(note.trim());
                  setNote("");
                  showToast("Note saved", "success");
                } catch (error: any) { showToast(error?.message || "Unable to save note", "error"); }
              }}
              disabled={!note.trim()}
              style={styles.noteFooterButton}
            />
          </View>
        }
      >
        <View style={styles.noteSheet}>
          <View style={[styles.noteReference, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.noteCustomer, { color: colors.text }]}>{connection.customerName}</Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              {connection.trBpNo} : {customer.siteArea}
            </Text>
          </View>
          <View style={styles.noteField}>
            <Text style={[typography.label, { color: colors.text }]}>Note</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Write a customer note..."
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </View>

          <View style={styles.noteHistory}>
            <Text style={[typography.label, { color: colors.text }]}>Previous Notes</Text>
            {notesLoading ? (
              <Text style={[typography.caption, { color: colors.muted }]}>Loading notes...</Text>
            ) : notes.length ? (
              notes.map((item) => (
                <View
                  key={item.id}
                  style={[styles.noteHistoryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>{item.note}</Text>
                  <Text style={[typography.caption, { color: colors.muted }]}>
                    {item.authorName} : {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[typography.caption, { color: colors.muted }]}>No notes yet.</Text>
            )}
          </View>
        </View>
      </Sheet>
    </>
  );
}

function EmptyCustomer({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Text style={[typography.bodyMedium, { color: colors.text }]}>
        Customer not found
      </Text>
      <Button label="Retry" variant="outline" onPress={onRetry} />
      <Button label="Go Back" onPress={() => router.back()} />
    </View>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerAction}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
  },
  header: {
    marginBottom: 0,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  loadingState: {
    alignItems: "center",
  },
  quickCard: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  quickTitle: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 17,
  },
  quickGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
  },
  quickIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  quickLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
  noteSheet: {
    gap: spacing.md,
  },
  noteReference: {
    gap: 2,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  noteCustomer: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  noteField: {
    gap: spacing.sm,
  },
  noteInput: {
    minHeight: 130,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body,
  },
  noteHistory: {
    gap: spacing.sm,
  },
  noteHistoryRow: {
    gap: 2,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
  },
  noteFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  noteFooterButton: {
    flex: 1,
    width: "auto",
    minWidth: 0,
  },
});
