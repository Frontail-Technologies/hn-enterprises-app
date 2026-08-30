import { memo, ReactNode, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Building2,
  CircleDot,
  ClipboardList,
  FileImage,
  Gauge,
  Info,
  Link2,
  MessageSquareWarning,
  Navigation,
  Phone,
  Receipt,
  Route,
  Ruler,
  StickyNote,
  User,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";
import Animated, { FadeIn } from "react-native-reanimated";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";

import { useBillingRemarksPanel } from "@/components/customer-sections/BillingRemarksPanel";
import { useCustomerComplaintsPanel } from "@/components/customer-sections/CustomerComplaintsPanel";
import { useCustomFieldsPanel } from "@/components/customer-sections/CustomFieldsPanel";
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
import { SectionBodySkeleton } from "@/components/shared/SectionBodySkeleton";
import { SectionTabBar } from "@/components/shared/SectionTabBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RevealGroup } from "@/components/ui/RevealGroup";
import { Screen } from "@/components/ui/Screen";
import { StickyHeaderGroup } from "@/components/ui/StickyHeaderGroup";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { Sheet } from "@/components/ui/Sheet";
import { motion } from "@/constants/motion";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { useCustomerRecord } from "@/hooks/useCustomerRecord";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { successHaptic } from "@/lib/haptics";
import { addActionBreadcrumb } from "@/lib/sentry";
import { useSwipeableTabs } from "@/hooks/useSwipeableTabs";
import {
  useCreateCustomerNoteMutation,
  useCustomerNotesQuery,
  useSetSectionCompletionMutation,
} from "@/queries";
import type {
  CompletionSectionKey,
  CustomerRecord,
  CustomerSectionCompletion,
  SectionCompletionResult,
} from "@/types/customers";
import { formatDate, formatTime } from "@/utils/format";
import { normalizeError } from "@/utils/normalizeError";

type PanelProps = { customer: CustomerRecord; onRefetch: () => Promise<void> };

function SectionPage({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <RevealGroup>{children}</RevealGroup>
      </ScrollView>
      {footer}
    </View>
  );
}

function SectionCompletionBar({
  customerId,
  sectionKey,
  sectionLabel,
  result,
}: {
  customerId: string;
  sectionKey: CompletionSectionKey;
  sectionLabel: string;
  result?: SectionCompletionResult;
}) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const mutation = useSetSectionCompletionMutation(customerId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const isDone = result?.status === "DONE";
  const tone =
    result?.status === "DONE"
      ? colors.green
      : result?.status === "IN_PROGRESS"
        ? colors.amber
        : colors.muted;
  const label = result
    ? result.status === "DONE"
      ? "Done"
      : result.status === "IN_PROGRESS"
        ? "In Progress"
        : "Not Started"
    : "";

  const run = (completed: boolean) => {
    if (mutation.isPending) return;
    addActionBreadcrumb("customer", "section_completion_started", { sectionKey, completed });
    mutation.mutate(
      { sectionKey, completed },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          if (completed) successHaptic();
          addActionBreadcrumb("customer", "section_completion_succeeded", { sectionKey, completed });
          showToast(
            completed
              ? `${sectionLabel} marked complete.`
              : `${sectionLabel} reopened.`,
            "success",
          );
        },
        onError: (error) => {
          setConfirmOpen(false);
          addActionBreadcrumb("customer", "section_completion_failed", { sectionKey, completed });
          showToast(
            error instanceof Error
              ? error.message
              : "Unable to update completion",
            "error",
          );
        },
      },
    );
  };

  return (
    <View
      style={[
        styles.completionBar,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Animated.View
        key={label}
        entering={reduceMotion ? undefined : FadeIn.duration(motion.duration.fast)}
        style={styles.completionStatus}
      >
        <View style={[styles.completionDot, { backgroundColor: tone }]} />
        <Text style={[styles.completionLabel, { color: colors.text }]}>
          {label}
        </Text>
      </Animated.View>
      <Button
        label={isDone ? "Reopen" : "Mark Complete"}
        variant="outline"
        size="compact"
        fullWidth={false}
        loading={mutation.isPending}
        onPress={() => (isDone ? setConfirmOpen(true) : run(true))}
      />
      <ConfirmSheet
        visible={confirmOpen}
        title={`Reopen ${sectionLabel}?`}
        message="This will mark the section as In Progress. Existing data will be kept."
        confirmLabel="Reopen"
        cancelLabel="Cancel"
        onConfirm={() => run(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

function CustomerPanelPage({ customer }: PanelProps) {
  const { content } = useCustomerInfoPanel(customer);
  return (
    <SectionPage>
      <CustomerQuickActions customer={customer} />
      {content}
      <CustomerNotesSection customerId={customer.id} />
    </SectionPage>
  );
}

function CustomerNotesSection({ customerId }: { customerId: string }) {
  const { colors } = useTheme();
  const { data: notes = [], isLoading } = useCustomerNotesQuery(customerId);

  return (
    <Card style={styles.notesCard}>
      <Text style={[styles.notesTitle, { color: colors.text }]}>Notes</Text>
      <View style={[styles.notesDivider, { backgroundColor: colors.border }]} />
      {isLoading ? (
        <Text style={[typography.caption, { color: colors.muted }]}>Loading notes...</Text>
      ) : notes.length ? (
        <View style={styles.noteHistory}>
          {notes.map((item) => (
            <View
              key={item.id}
              style={[styles.noteHistoryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[typography.body, { color: colors.text }]}>{item.note}</Text>
              <Text style={[typography.caption, { color: colors.muted }]}>
                {item.authorName} : {formatDate(item.createdAt)} {formatTime(item.createdAt)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[typography.caption, { color: colors.muted }]}>No notes yet.</Text>
      )}
    </Card>
  );
}

function SurveyPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useSurveyPanel(customer, onRefetch);
  return <SectionPage footer={footer}>{content}</SectionPage>;
}

function GiPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useGiMeasurementsPanel(customer, onRefetch);
  return (
    <SectionPage footer={footer}>
      <SectionCompletionBar
        customerId={customer.id}
        sectionKey="giMeasurements"
        sectionLabel="GI Measurements"
        result={customer.sectionCompletion?.giMeasurements}
      />
      {content}
    </SectionPage>
  );
}

function IsolationPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useIsolationRegulatorsPanel(customer, onRefetch);
  return (
    <SectionPage footer={footer}>
      <SectionCompletionBar
        customerId={customer.id}
        sectionKey="valvesRegulators"
        sectionLabel="Isolation & Regulators"
        result={customer.sectionCompletion?.valvesRegulators}
      />
      {content}
    </SectionPage>
  );
}

function FittingsPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useFittingsAccessoriesPanel(customer, onRefetch);
  return (
    <SectionPage footer={footer}>
      <SectionCompletionBar
        customerId={customer.id}
        sectionKey="fittingsAccessories"
        sectionLabel="Fittings & Accessories"
        result={customer.sectionCompletion?.fittingsAccessories}
      />
      {content}
    </SectionPage>
  );
}

function LmcPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useLmcPipelinePanel(customer, onRefetch);
  return <SectionPage footer={footer}>{content}</SectionPage>;
}

function CivilPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useCivilWorkForm(customer, onRefetch);
  return <SectionPage footer={footer}>{content}</SectionPage>;
}

function MdpePanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useMdpeFittingsPanel(customer, onRefetch);
  return (
    <SectionPage footer={footer}>
      <SectionCompletionBar
        customerId={customer.id}
        sectionKey="mdpeFittings"
        sectionLabel="MDPE Fittings"
        result={customer.sectionCompletion?.mdpeFittings}
      />
      {content}
    </SectionPage>
  );
}

function MeterPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useMeterCommissioningPanel(customer, onRefetch);
  return <SectionPage footer={footer}>{content}</SectionPage>;
}

function BillingPanelPage({ customer, onRefetch }: PanelProps) {
  const { content, footer } = useBillingRemarksPanel(customer, onRefetch);
  return <SectionPage footer={footer}>{content}</SectionPage>;
}

function DocumentsPanelPage({ customer }: PanelProps) {
  const { content } = useDocumentsPanel(customer);
  return <SectionPage>{content}</SectionPage>;
}

function ComplaintsPanelPage({ customer }: PanelProps) {
  const { content } = useCustomerComplaintsPanel(customer);
  return <SectionPage>{content}</SectionPage>;
}

const SECTION_COMPLETION_KEY: Record<string, keyof CustomerSectionCompletion> =
  {
    survey: "survey",
    "gi-measurements": "giMeasurements",
    "isolation-regulators": "valvesRegulators",
    "fittings-accessories": "fittingsAccessories",
    lmc: "lmc",
    "civil-work": "lmc",
    "mdpe-fittings": "mdpeFittings",
    "meter-commissioning": "commissioning",
  };

const CustomerPanelPageMemo = memo(CustomerPanelPage);
const SurveyPanelPageMemo = memo(SurveyPanelPage);
const GiPanelPageMemo = memo(GiPanelPage);
const IsolationPanelPageMemo = memo(IsolationPanelPage);
const FittingsPanelPageMemo = memo(FittingsPanelPage);
const LmcPanelPageMemo = memo(LmcPanelPage);
const CivilPanelPageMemo = memo(CivilPanelPage);
const MdpePanelPageMemo = memo(MdpePanelPage);
const MeterPanelPageMemo = memo(MeterPanelPage);
const BillingPanelPageMemo = memo(BillingPanelPage);
const DocumentsPanelPageMemo = memo(DocumentsPanelPage);
const ComplaintsPanelPageMemo = memo(ComplaintsPanelPage);

const FIXED_SECTIONS: {
  key: string;
  label: string;
  Component: (props: PanelProps) => ReactNode;
  icon: LucideIcon;
}[] = [
  { key: "customer", label: "Customer", Component: CustomerPanelPageMemo, icon: User },
  { key: "survey", label: "Survey", Component: SurveyPanelPageMemo, icon: ClipboardList },
  { key: "gi-measurements", label: "GI Measurements", Component: GiPanelPageMemo, icon: Ruler },
  {
    key: "isolation-regulators",
    label: "Isolation & Regulators",
    Component: IsolationPanelPageMemo,
    icon: CircleDot,
  },
  {
    key: "fittings-accessories",
    label: "Fittings & Accessories",
    Component: FittingsPanelPageMemo,
    icon: Wrench,
  },
  { key: "lmc", label: "LMC Pipeline", Component: LmcPanelPageMemo, icon: Route },
  { key: "civil-work", label: "Civil Work", Component: CivilPanelPageMemo, icon: Building2 },
  { key: "mdpe-fittings", label: "MDPE Fittings", Component: MdpePanelPageMemo, icon: Link2 },
  {
    key: "meter-commissioning",
    label: "Meter & Commissioning",
    Component: MeterPanelPageMemo,
    icon: Gauge,
  },
  {
    key: "billing-remarks",
    label: "JMR / Billing Remarks",
    Component: BillingPanelPageMemo,
    icon: Receipt,
  },
  {
    key: "documents",
    label: "Photos / Documents",
    Component: DocumentsPanelPageMemo,
    icon: FileImage,
  },
  {
    key: "complaints",
    label: "Complaints",
    Component: ComplaintsPanelPageMemo,
    icon: MessageSquareWarning,
  },
];

export default function CustomerWorkspaceScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    trBp?: string;
    site?: string;
  }>();
  const { customer, error, refetch } = useCustomerRecord(params.id);

  if (customer) {
    return <CustomerWorkspaceContent customer={customer} onRefetch={refetch} />;
  }

  if (error) {
    return (
      <Screen
        edges={["bottom"]}
        contentStyle={styles.screen}
        revealContent={false}
      >
        <AppHeader title={params.name ?? "Customer"} left={<BackButton />} />
        <EmptyCustomer onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <CustomerWorkspaceSkeleton
      name={params.name}
      trBp={params.trBp}
      site={params.site}
    />
  );
}

function CustomerWorkspaceContent({ customer, onRefetch }: PanelProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const connection = customer.customerConnection;

  useEffect(() => {
    addActionBreadcrumb("customer", "detail_opened");
  }, []);

  const canEdit = user?.role !== "supervisor" || connection.supervisorId === user?.id;

  const customFieldGroupTabs = useCustomFieldsPanel(customer, onRefetch);

  const tabs = [
    ...FIXED_SECTIONS.map((section) => ({
      key: section.key,
      label: section.label,
      icon: section.icon as LucideIcon | undefined,
      render: () => (
        <section.Component customer={customer} onRefetch={onRefetch} />
      ),
    })),
    ...customFieldGroupTabs.map((group) => ({
      key: group.key,
      label: group.label,
      icon: undefined as LucideIcon | undefined,
      render: () => (
        <SectionPage footer={group.panel.footer}>
          {group.panel.content}
        </SectionPage>
      ),
    })),
  ];

  const tabKeys = tabs.map((tab) => tab.key);

  const {
    activeKey: activeSection,
    pagerRef,
    initialIndex,
    onPageSelected,
    isMounted,
    selectTab: handleTabChange,
  } = useSwipeableTabs(tabKeys);

  return (
    <Screen
      edges={["bottom"]}
      contentStyle={styles.screen}
      revealContent={false}
    >
      <StickyHeaderGroup>
        <AppHeader
          title={connection.customerName}
          subtitle={`${connection.trBpNo} : ${customer.siteArea}`}
          left={<BackButton />}
          style={styles.header}
        />

        <SectionTabBar
          tabs={tabs.map((tab) => {
            const completionKey = SECTION_COMPLETION_KEY[tab.key];
            return {
              key: tab.key,
              label: tab.label,
              icon: tab.icon,
              status: completionKey
                ? customer.sectionCompletion?.[completionKey]?.status
                : undefined,
            };
          })}
          activeKey={activeSection}
          onChange={handleTabChange}
          surface
        />
      </StickyHeaderGroup>

      {!canEdit ? (
        <View style={[styles.readOnlyBanner, { backgroundColor: colors.softOrange }]}>
          <Info size={16} color={colors.primary} />
          <Text style={[typography.label, styles.readOnlyText, { color: colors.text }]}>
            You&apos;re not the assigned supervisor for this customer - changes are view only.
          </Text>
        </View>
      ) : null}

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
      >
        {tabs.map((tab) => (
          <View key={tab.key} style={styles.page}>
            {isMounted(tab.key) ? tab.render() : null}
          </View>
        ))}
      </PagerView>
    </Screen>
  );
}

function CustomerWorkspaceSkeleton({
  name,
  trBp,
  site,
}: {
  name?: string;
  trBp?: string;
  site?: string;
}) {
  return (
    <Screen
      edges={["bottom"]}
      contentStyle={styles.screen}
      revealContent={false}
    >
      <StickyHeaderGroup>
        <AppHeader
          title={name ?? "Customer"}
          subtitle={trBp ? `${trBp} : ${site ?? ""}` : undefined}
          left={<BackButton />}
          style={styles.header}
        />

        <SectionTabBar
          tabs={FIXED_SECTIONS.map((section) => ({
            key: section.key,
            label: section.label,
            icon: section.icon,
          }))}
          activeKey={FIXED_SECTIONS[0].key}
          onChange={() => {}}
          surface
        />
      </StickyHeaderGroup>

      <View style={styles.pager}>
        <View style={styles.pageContent}>
          <SectionBodySkeleton />
        </View>
      </View>
    </Screen>
  );
}

function CustomerQuickActions({ customer }: { customer: CustomerRecord }) {
  const { colors } = useTheme();
  const { showToast } = useToast();
  const connection = customer.customerConnection;
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const { data: notes = [], isLoading: notesLoading } = useCustomerNotesQuery(
    noteOpen ? customer.id : undefined,
  );
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
        if (connection.mobileNo)
          void Linking.openURL(`tel:${connection.mobileNo}`);
      },
    },
    {
      label: "Navigate",
      icon: Navigation,
      onPress: () => {
        const query = encodeURIComponent(
          `${connection.fullAddress}, ${customer.city}`,
        );
        void Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${query}`,
        );
      },
    },
  ];

  return (
    <>
      <Card style={styles.quickCard}>
        <Text style={[styles.quickTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
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
                <View
                  style={[
                    styles.quickIcon,
                    { backgroundColor: colors.softBlue },
                  ]}
                >
                  <Icon size={17} color={colors.accent} />
                </View>
                <Text
                  style={[styles.quickLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
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
          <View style={styles.noteFooter}>
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
                } catch (error) {
                  showToast(
                    normalizeError(error, "Unable to save note"),
                    "error",
                  );
                }
              }}
              disabled={!note.trim()}
              style={styles.noteFooterButton}
            />
          </View>
        }
      >
        <View style={styles.noteSheet}>
          <View
            style={[
              styles.noteReference,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.noteCustomer, { color: colors.text }]}>
              {connection.customerName}
            </Text>
            <Text style={[typography.caption, { color: colors.muted }]}>
              {connection.trBpNo} : {customer.siteArea}
            </Text>
          </View>
          <View style={styles.noteField}>
            <Text style={[typography.label, { color: colors.text }]}>Note</Text>
            <BottomSheetTextInput
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
            <Text style={[typography.label, { color: colors.text }]}>
              Previous Notes
            </Text>
            {notesLoading ? (
              <Text style={[typography.caption, { color: colors.muted }]}>
                Loading notes...
              </Text>
            ) : notes.length ? (
              notes.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.noteHistoryRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.body, { color: colors.text }]}>
                    {item.note}
                  </Text>
                  <Text style={[typography.caption, { color: colors.muted }]}>
                    {item.authorName} : {formatDate(item.createdAt)}{" "}
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[typography.caption, { color: colors.muted }]}>
                No notes yet.
              </Text>
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
  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readOnlyText: {
    flex: 1,
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
    flexGrow: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  completionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  completionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  completionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completionLabel: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 17,
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
  notesCard: {
    gap: spacing.xs,
    padding: spacing.md,
  },
  notesTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  notesDivider: {
    height: 1,
    marginBottom: spacing.xs,
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
  },
  noteFooterButton: {
    flex: 1,
    width: "auto",
    minWidth: 0,
  },
});
