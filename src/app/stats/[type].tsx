import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Filter, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ScrollableTable } from '@/components/shared/ScrollableTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import {
  getSupervisorStatById,
  getSupervisorStatDetails,
  type SupervisorStatDetailRow,
} from '@/services/mobileStats';

type DetailStatus = SupervisorStatDetailRow['status'] | 'All';

const statusOptions: DetailStatus[] = [
  'All',
  'Done',
  'Pending',
  'In Progress',
  'Sent Back',
  'Not Started',
  'On Hold',
  'Planned',
  'Delayed',
  'Not Required',
];

export default function StatDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { colors } = useTheme();
  const stat = getSupervisorStatById(String(type));
  const rows = getSupervisorStatDetails(String(type));
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DetailStatus>('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [siteSearch, setSiteSearch] = useState('');

  const siteOptions = useMemo(
    () => ['All', ...Array.from(new Set(rows.map((row) => row.site))).filter(Boolean)],
    [rows],
  );

  const visibleSiteOptions = useMemo(() => {
    const query = siteSearch.trim().toLowerCase();
    if (!query) return siteOptions;
    return siteOptions.filter((site) => site.toLowerCase().includes(query));
  }, [siteOptions, siteSearch]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [row.title, row.reference, row.site, row.status, row.helper]
          .join(' ')
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      const matchesSite = siteFilter === 'All' || row.site === siteFilter;

      return matchesSearch && matchesStatus && matchesSite;
    });
  }, [rows, search, siteFilter, statusFilter]);

  const resetFilters = () => {
    setStatusFilter('All');
    setSiteFilter('All');
    setSiteSearch('');
    setFilterOpen(false);
  };

  return (
    <Screen scroll edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title={stat?.label ?? 'Stat Details'} subtitle={`${filteredRows.length} records`} left={<BackButton />} />

      <Input
        value={search}
        onChangeText={setSearch}
        placeholder="Search records..."
        leftIcon={<Search size={18} color={colors.muted} />}
        rightIcon={<Filter size={18} color={colors.primary} />}
        onRightIconPress={() => setFilterOpen(true)}
      />

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          Showing {filteredRows.length} of {rows.length} records
        </Text>
        <ScrollableTable
          header={
            <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.softOrange, borderColor: colors.border }]}>
              <Text style={[styles.headerCell, styles.nameCell, { color: colors.muted, borderColor: colors.border }]}>Name / Work</Text>
              <Text style={[styles.headerCell, styles.refCell, { color: colors.muted, borderColor: colors.border }]}>Reference</Text>
              <Text style={[styles.headerCell, styles.siteCell, { color: colors.muted, borderColor: colors.border }]}>Site</Text>
              <Text style={[styles.headerCell, styles.statusCell, { color: colors.muted, borderColor: colors.border }]}>Status</Text>
              <Text style={[styles.headerCell, styles.dateCell, { color: colors.muted, borderColor: colors.border }]}>Date</Text>
              <Text style={[styles.headerCell, styles.helperCell, { color: colors.muted, borderColor: colors.border }]}>Detail</Text>
            </View>
          }
        >
          {filteredRows.map((row) => (
            <StatTableRow key={row.id} row={row} />
          ))}
        </ScrollableTable>
      </View>

      <Sheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Records"
        footer={
          <View style={styles.footer}>
            <Button label="Reset" variant="outline" onPress={resetFilters} style={styles.footerButton} />
            <Button label="Apply" onPress={() => setFilterOpen(false)} style={styles.footerButton} />
          </View>
        }
      >
        <View style={styles.filterGroup}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Status</Text>
          {statusOptions.map((status) => (
            <FilterOption
              key={status}
              label={status}
              active={statusFilter === status}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </View>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterTitle, { color: colors.text }]}>Site</Text>
          <Input
            placeholder="Search site..."
            value={siteSearch}
            onChangeText={setSiteSearch}
            leftIcon={<Search size={18} color={colors.muted} />}
          />
          {visibleSiteOptions.map((site) => (
            <FilterOption
              key={site}
              label={site}
              active={siteFilter === site}
              onPress={() => setSiteFilter(site)}
            />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={styles.headerButton}>
      <ArrowLeft size={22} color="#FFFFFF" />
    </Pressable>
  );
}

function StatTableRow({ row }: { row: SupervisorStatDetailRow }) {
  const { colors } = useTheme();
  const canOpen = Boolean(row.customerId);

  return (
    <Pressable
      disabled={!canOpen}
      onPress={() => {
        if (!row.customerId) return;
        router.push({ pathname: '/customers/[id]', params: { id: row.customerId } });
      }}
      style={({ pressed }) => pressed && canOpen && { opacity: 0.72 }}
    >
      <View style={[styles.tableRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.nameCell, styles.bodyCell, { borderColor: colors.border }]}>
          <Text style={[styles.primaryCellText, { color: colors.text }]} numberOfLines={1}>
            {row.title}
          </Text>
        </View>
        <Text style={[styles.refCell, styles.bodyCell, styles.cellText, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
          {row.reference || '-'}
        </Text>
        <Text style={[styles.siteCell, styles.bodyCell, styles.cellText, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
          {row.site || '-'}
        </Text>
        <View style={[styles.statusCell, styles.bodyCell, { borderColor: colors.border }]}>
          <StatusPill status={row.status} />
        </View>
        <Text style={[styles.dateCell, styles.bodyCell, styles.cellText, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
          {row.updatedOn || '-'}
        </Text>
        <Text style={[styles.helperCell, styles.bodyCell, styles.cellText, { color: colors.text, borderColor: colors.border }]} numberOfLines={1}>
          {row.helper || '-'}
        </Text>
      </View>
    </Pressable>
  );
}

function FilterOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: active ? colors.softOrange : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.78 },
      ]}
    >
      <Text style={[typography.body, { color: active ? colors.primary : colors.text }]}>{label}</Text>
      {active ? <Check size={17} color={colors.primary} /> : null}
    </Pressable>
  );
}

function StatusPill({ status }: { status: SupervisorStatDetailRow['status'] }) {
  const { colors } = useTheme();
  const color =
    status === 'Done'
      ? colors.green
      : status === 'Sent Back'
        ? colors.red
        : status === 'In Progress'
          ? colors.blue
          : colors.primary;

  return (
    <View style={[styles.pill, { backgroundColor: colors.softOrange }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tablePanel: {
    gap: spacing.sm,
    padding: spacing.sm,
  },
  resultText: {
    ...typography.caption,
    paddingHorizontal: spacing.xs,
  },
  tableRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tableHeader: {
    minHeight: 38,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  headerCell: {
    ...typography.caption,
    minHeight: 38,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textTransform: 'uppercase',
  },
  bodyCell: {
    minHeight: 48,
    justifyContent: 'center',
    borderRightWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  primaryCellText: {
    ...typography.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  cellText: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 16,
  },
  nameCell: {
    width: 150,
  },
  refCell: {
    width: 112,
  },
  siteCell: {
    width: 150,
  },
  statusCell: {
    width: 112,
  },
  dateCell: {
    width: 106,
  },
  helperCell: {
    width: 190,
  },
  pill: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pillText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
  },
  filterGroup: {
    gap: spacing.sm,
  },
  filterTitle: {
    ...typography.label,
  },
  option: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
