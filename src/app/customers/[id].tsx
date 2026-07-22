import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Navigation, Phone, StickyNote } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useBillingRemarksPanel } from "@/components/customer-sections/BillingRemarksPanel";
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
import { StickyHeaderGroup } from "@/components/ui/StickyHeaderGroup";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { getCustomerById } from "@/services/mockData";
import type { CustomerRecord } from "@/services/mockData";

export default function CustomerWorkspaceScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customer = getCustomerById(params.id ?? "");

  if (!customer) {
    return (
      <Screen tabBarAware edges={["bottom"]} contentStyle={styles.screen}>
        <AppHeader title="Customer" left={<BackButton />} />
        <EmptyCustomer />
      </Screen>
    );
  }

  return <CustomerWorkspaceContent customer={customer} />;
}

function CustomerWorkspaceContent({ customer }: { customer: CustomerRecord }) {
  const connection = customer.customerConnection;

  // Every technical section is now an inline tab panel. Hooks must be called
  // unconditionally regardless of which tab is active (Rules of Hooks).
  const customerInfoPanel = useCustomerInfoPanel(customer);
  const surveyPanel = useSurveyPanel(customer);
  const giPanel = useGiMeasurementsPanel(customer);
  const isolationPanel = useIsolationRegulatorsPanel(customer);
  const fittingsPanel = useFittingsAccessoriesPanel(customer);
  const lmcPanel = useLmcPipelinePanel(customer);
  const civilWorkPanel = useCivilWorkForm(customer);
  const mdpePanel = useMdpeFittingsPanel(customer);
  const meterPanel = useMeterCommissioningPanel(customer);
  const billingPanel = useBillingRemarksPanel(customer);
  const documentsPanel = useDocumentsPanel(customer);

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
  ];

  const [activeSection, setActiveSection] = useState(tabs[0].key);
  const activeTab = tabs.find((tab) => tab.key === activeSection) ?? tabs[0];

  return (
    <Screen
      scroll
      tabBarAware
      edges={["bottom"]}
      contentStyle={styles.screen}
      bottomAccessory={activeTab.panel.footer}
    >
      <StickyHeaderGroup>
        <AppHeader
          title={connection.customerName}
          subtitle={`${connection.trBpNo} : ${customer.siteArea}`}
          left={<BackButton />}
          style={styles.header}
        />

        <SectionTabBar
          tabs={tabs.map((tab) => ({ key: tab.key, label: tab.label }))}
          activeKey={activeSection}
          onChange={setActiveSection}
        />
      </StickyHeaderGroup>

      {activeSection === "customer" ? <CustomerQuickActions customer={customer} /> : null}

      <View style={styles.section}>{activeTab.panel.content}</View>
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
              onPress={() => {
                setNote("");
                setNoteOpen(false);
                showToast("Note saved", "success");
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
        </View>
      </Sheet>
    </>
  );
}

function EmptyCustomer() {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Text style={[typography.bodyMedium, { color: colors.text }]}>
        Customer not found
      </Text>
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
    paddingBottom: 104,
  },
  header: {
    marginBottom: 0,
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
  section: {
    gap: spacing.md,
  },
  quickCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  quickTitle: {
    ...typography.bodyMedium,
    fontSize: 14,
    lineHeight: 19,
  },
  quickGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    minHeight: 74,
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
