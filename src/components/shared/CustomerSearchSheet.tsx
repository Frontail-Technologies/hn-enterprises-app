import { router } from 'expo-router';
import { ArrowRight, Check, ChevronDown, MapPin, Phone, Search, SlidersHorizontal, UserRound, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useCustomerList } from '@/hooks/useCustomerRecord';
import { guardNavigation } from '@/lib/navigation';
import type { CustomerRecord } from '@/services/mockData';

type CustomerSearchSheetProps = {
  title?: string;
  subtitle?: string;
  showTitle?: boolean;
  onSelect?: (customer: CustomerRecord) => void;
};

export function CustomerSearchSheet({
  title = 'Search Customer / BP-TR',
  subtitle,
  showTitle = true,
  onSelect,
}: CustomerSearchSheetProps) {
  const { colors } = useTheme();
  const { customers, isLoading } = useCustomerList();
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const projectOptions = useMemo(() => ['All', ...Array.from(new Set(customers.map((customer) => customer.projectName)))], [customers]);
  const siteOptions = useMemo(() => ['All', ...Array.from(new Set(customers.map((customer) => customer.siteArea)))], [customers]);
  const typeOptions = useMemo(
    () => ['All', ...Array.from(new Set(customers.map((customer) => customer.customerConnection.connectionType)))],
    [customers],
  );
  const statusOptions = useMemo(() => ['All', ...Array.from(new Set(customers.map((customer) => customer.status)))], [customers]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const connection = customer.customerConnection;
      const matchesProject = projectFilter === 'All' || customer.projectName === projectFilter;
      const matchesSite = siteFilter === 'All' || customer.siteArea === siteFilter;
      const matchesType = typeFilter === 'All' || connection.connectionType === typeFilter;
      const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
      const matchesSearch =
        !query ||
        [
        connection.customerName,
        connection.trBpNo,
        connection.mobileNo,
        customer.projectName,
        customer.siteArea,
      ]
        .join(' ')
        .toLowerCase()
          .includes(query);

      return matchesProject && matchesSite && matchesType && matchesStatus && matchesSearch;
    });
  }, [customers, projectFilter, search, siteFilter, statusFilter, typeFilter]);

  const handleSelect = (customer: CustomerRecord) => {
    if (onSelect) {
      onSelect(customer);
      return;
    }

    guardNavigation(() =>
      router.push({
        pathname: '/customers/[id]',
        params: { id: customer.id },
      }),
    );
  };

  return (
    <View style={styles.wrapper}>
      {showTitle ? (
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {subtitle ? <Text style={[typography.label, { color: colors.muted }]}>{subtitle}</Text> : null}
          </View>
          <Text style={[typography.label, { color: colors.muted }]}>{filteredCustomers.length} found</Text>
        </View>
      ) : (
        <View style={styles.compactCountRow}>
          <Text style={[typography.label, { color: colors.muted }]}>{filteredCustomers.length} customers found</Text>
        </View>
      )}

      <Input
        placeholder="Search name, BP/TR, mobile or site"
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={18} color={colors.muted} />}
        rightIcon={<SlidersHorizontal size={18} color={colors.primary} />}
        onRightIconPress={() => setFiltersOpen(true)}
      />

      <Modal animationType="slide" transparent visible={filtersOpen} onRequestClose={() => setFiltersOpen(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter Customers</Text>
              <Pressable onPress={() => setFiltersOpen(false)} style={styles.closeButton}>
                <X size={20} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <SearchableSelect label="Project" options={projectOptions} value={projectFilter} onChange={setProjectFilter} />
              <SearchableSelect label="Site" options={siteOptions} value={siteFilter} onChange={setSiteFilter} />
              <SearchableSelect label="Type" options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
              <SearchableSelect label="Status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
            </ScrollView>
            <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={() => {
                  setProjectFilter('All');
                  setSiteFilter('All');
                  setTypeFilter('All');
                  setStatusFilter('All');
                }}
                style={[styles.footerButton, { borderColor: colors.border }]}
              >
                <Text style={[typography.label, { color: colors.text }]}>Reset</Text>
              </Pressable>
              <Pressable
                onPress={() => setFiltersOpen(false)}
                style={[styles.footerButton, styles.applyButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[typography.label, { color: '#FFFFFF' }]}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.list}>
        {isLoading ? (
          <Card style={styles.customerCard}>
            <Text style={[typography.bodyMedium, { color: colors.muted }]}>Loading customers...</Text>
          </Card>
        ) : null}
        {!isLoading && filteredCustomers.length === 0 ? (
          <Card style={styles.customerCard}>
            <Text style={[typography.bodyMedium, { color: colors.muted }]}>No customers found</Text>
          </Card>
        ) : null}
        {!isLoading && filteredCustomers.map((customer) => {
          const connection = customer.customerConnection;
          return (
            <Pressable
              key={customer.id}
              onPress={() => handleSelect(customer)}
              style={({ pressed }) => [pressed && { opacity: 0.84 }]}
            >
              <Card style={styles.customerCard}>
                <View style={[styles.avatar, { backgroundColor: colors.softOrange }]}>
                  <UserRound size={18} color={colors.primary} />
                </View>
                <View style={styles.customerCopy}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.customerName, { color: colors.text }]}>{connection.customerName}</Text>
                    <StatusBadge status={customer.status} />
                  </View>
                  <Text style={[typography.caption, { color: colors.muted }]}>
                    {connection.trBpNo} : {connection.connectionType}
                  </Text>
                  <View style={styles.inlineMeta}>
                    <Phone size={13} color={colors.muted} />
                    <Text style={[typography.label, { color: colors.muted }]}>{connection.mobileNo}</Text>
                  </View>
                  <View style={styles.inlineMeta}>
                    <MapPin size={13} color={colors.muted} />
                    <Text style={[typography.label, styles.siteText, { color: colors.muted }]} numberOfLines={1}>
                      {customer.siteArea}
                    </Text>
                  </View>
                </View>
                <ArrowRight size={17} color={colors.primary} />
              </Card>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SearchableSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <View style={styles.selectGroup}>
      <Text style={[typography.label, { color: colors.muted }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [
          styles.selectButton,
          { backgroundColor: colors.surface, borderColor: open ? colors.primary : colors.border },
          pressed && { opacity: 0.84 },
        ]}
      >
        <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
          {value}
        </Text>
        <ChevronDown size={18} color={colors.muted} />
      </Pressable>
      {open ? (
        <View style={[styles.optionsPanel, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Input
            placeholder={`Search ${label.toLowerCase()}`}
            value={query}
            onChangeText={setQuery}
            leftIcon={<Search size={16} color={colors.muted} />}
          />
          <View style={styles.optionsList}>
            {filteredOptions.map((option) => {
              const selected = value === option;

              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    { backgroundColor: selected ? colors.softOrange : colors.card },
                    pressed && { opacity: 0.84 },
                  ]}
                >
                  <Text style={[typography.body, { color: selected ? colors.primary : colors.text }]}>{option}</Text>
                  {selected ? <Check size={17} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  compactCountRow: {
    alignItems: 'flex-end',
  },
  list: {
    gap: spacing.md,
  },
  selectGroup: {
    gap: spacing.sm,
  },
  selectButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  optionsPanel: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  optionsList: {
    overflow: 'hidden',
    borderRadius: radius.sm,
  },
  optionRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  sheet: {
    maxHeight: '82%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sheetHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  sheetTitle: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  footerButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.sm,
  },
  applyButton: {
    borderWidth: 1,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  customerCopy: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  customerName: {
    ...typography.bodyMedium,
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  siteText: {
    flex: 1,
  },
});
