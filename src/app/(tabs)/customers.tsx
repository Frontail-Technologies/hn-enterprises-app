import { router } from 'expo-router';
import { Check, Filter, Search } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { customers } from '@/services/mockData';

type CustomerGridRow = {
  id: string;
  trBpNo: string;
  customerName: string;
  fullAddress: string;
  mobileNo: string;
  projectName: string;
  siteArea: string;
  status: string;
  canOpen: boolean;
};

type ColumnKey = keyof Pick<
  CustomerGridRow,
  'trBpNo' | 'customerName' | 'fullAddress' | 'mobileNo' | 'siteArea' | 'status'
>;

type GridColumn = {
  key: ColumnKey;
  label: string;
  width: number;
};

const columns: GridColumn[] = [
  { key: 'trBpNo', label: 'BP / TR', width: 116 },
  { key: 'customerName', label: 'Name', width: 150 },
  { key: 'fullAddress', label: 'Address', width: 260 },
  { key: 'mobileNo', label: 'Phone', width: 126 },
  { key: 'siteArea', label: 'Site', width: 150 },
  { key: 'status', label: 'Status', width: 116 },
];

const demoMasterRows: CustomerGridRow[] = [
  {
    id: 'demo-master-001',
    trBpNo: 'T23D007585',
    customerName: 'HIMANGSHU DUTTA',
    fullAddress: 'GANESH MANDIR PATH NOONMATI',
    mobileNo: '9864054318',
    projectName: 'Demo CGD Project',
    siteArea: 'Noonmati',
    status: 'Active',
    canOpen: false,
  },
  {
    id: 'demo-master-002',
    trBpNo: 'T23D007588',
    customerName: 'HIMANGSHU DUTTA',
    fullAddress: 'GANESH MANDIR PATH NOONMATI',
    mobileNo: '9508450514',
    projectName: 'Demo CGD Project',
    siteArea: 'Noonmati',
    status: 'Pending',
    canOpen: false,
  },
  {
    id: 'demo-master-003',
    trBpNo: 'T23D005962',
    customerName: 'MAHADEB PASOWAN',
    fullAddress: '05 NEW GUWAHATI RAILWAY COLONY BAMUNIMAIDAN RAILWAY COLONY ROAD',
    mobileNo: '6001987369',
    projectName: 'Demo CGD Project',
    siteArea: 'Bamunimaidan',
    status: 'Active',
    canOpen: false,
  },
  {
    id: 'demo-master-004',
    trBpNo: '3106000096',
    customerName: 'ASWINI SARMA',
    fullAddress: 'NEAR GATE HOSPITAL, ADARANI PATH, GEETA NAGAR',
    mobileNo: '9101094721',
    projectName: 'Demo CGD Project',
    siteArea: 'Geeta Nagar',
    status: 'On Hold',
    canOpen: false,
  },
];

export default function CustomersScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Partial<Record<ColumnKey, string[]>>>({});
  const [activeColumn, setActiveColumn] = useState<GridColumn | null>(null);
  const [pendingValues, setPendingValues] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const openingRowRef = useRef<string | null>(null);

  const rows = useMemo<CustomerGridRow[]>(
    () => [
      ...customers.map((customer) => ({
        id: customer.id,
        trBpNo: customer.customerConnection.trBpNo,
        customerName: customer.customerConnection.customerName,
        fullAddress: customer.customerConnection.fullAddress,
        mobileNo: customer.customerConnection.mobileNo,
        projectName: customer.projectName,
        siteArea: customer.siteArea,
        status: customer.status,
        canOpen: true,
      })),
      ...demoMasterRows,
    ],
    [],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = query
        ? columns.some((column) => String(row[column.key]).toLowerCase().includes(query))
        : true;
      const matchesFilters = columns.every((column) => {
        const values = filters[column.key];
        return values?.length ? values.includes(String(row[column.key])) : true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [filters, rows, search]);

  const activeValues = useMemo(() => {
    if (!activeColumn) return [];
    const query = filterSearch.trim().toLowerCase();
    return Array.from(new Set(rows.map((row) => String(row[activeColumn.key]))))
      .filter(Boolean)
      .filter((value) => (query ? value.toLowerCase().includes(query) : true));
  }, [activeColumn, filterSearch, rows]);

  const openFilter = (column: GridColumn) => {
    setActiveColumn(column);
    setPendingValues(filters[column.key] ?? []);
    setFilterSearch('');
  };

  const togglePendingValue = (value: string) => {
    setPendingValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const applyFilter = () => {
    if (!activeColumn) return;
    setFilters((current) => ({
      ...current,
      [activeColumn.key]: pendingValues,
    }));
    setFilterSearch('');
    setActiveColumn(null);
  };

  const clearFilter = () => {
    if (!activeColumn) return;
    setFilters((current) => {
      const next = { ...current };
      delete next[activeColumn.key];
      return next;
    });
    setPendingValues([]);
    setFilterSearch('');
    setActiveColumn(null);
  };

  const openCustomer = (row: CustomerGridRow) => {
    if (!row.canOpen) return;

    if (openingRowRef.current === row.id) return;

    openingRowRef.current = row.id;
    router.push({
      pathname: '/customers/[id]',
      params: { id: row.id },
    });
    setTimeout(() => {
      if (openingRowRef.current === row.id) openingRowRef.current = null;
    }, 900);
  };

  return (
    <Screen tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="Customers" subtitle="Search and open customer workspace" />
      <Input
        placeholder="Search customer, BP/TR, mobile or address"
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={18} color={colors.muted} />}
      />

      <View style={styles.tablePanel}>
        <Text style={[styles.resultText, { color: colors.muted }]}>
          Showing {filteredRows.length} of {rows.length} records
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={styles.table}>
            <View style={[styles.headerRow, { backgroundColor: colors.softOrange, borderColor: colors.border }]}>
              {columns.map((column) => {
                const active = Boolean(filters[column.key]?.length);
                return (
                  <Pressable
                    key={column.key}
                    onPress={() => openFilter(column)}
                    style={[styles.headerCell, { width: column.width, borderColor: colors.border }]}
                  >
                    <Text style={[styles.headerText, { color: active ? colors.primary : colors.text }]} numberOfLines={1}>
                      {column.label}
                    </Text>
                    <Filter size={13} color={active ? colors.primary : colors.muted} />
                  </Pressable>
                );
              })}
            </View>

            <ScrollView style={styles.bodyScroll} nestedScrollEnabled showsVerticalScrollIndicator>
              {filteredRows.map((row, index) => (
                <Pressable
                  key={row.id}
                  disabled={!row.canOpen}
                  onPress={() => openCustomer(row)}
                  style={({ pressed }) => [
                    styles.dataRow,
                    {
                      backgroundColor: index % 2 === 0 ? colors.card : colors.background,
                      borderColor: colors.border,
                      opacity: !row.canOpen ? 0.72 : pressed ? 0.62 : 1,
                    },
                  ]}
                >
                  {columns.map((column) => (
                    <View key={column.key} style={[styles.dataCell, { width: column.width, borderColor: colors.border }]}>
                      <Text style={[styles.cellText, { color: colors.text }]} numberOfLines={2}>
                        {String(row[column.key]) || '-'}
                      </Text>
                    </View>
                  ))}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      <Sheet
        visible={Boolean(activeColumn)}
        onClose={() => setActiveColumn(null)}
        title={activeColumn ? `Filter ${activeColumn.label}` : 'Filter'}
        footer={
          <View style={[styles.filterFooter, { borderTopColor: colors.border }]}>
            <Button label="Clear" variant="outline" onPress={clearFilter} style={styles.footerButton} />
            <Button label="Apply" onPress={applyFilter} style={styles.footerButton} />
          </View>
        }
      >
        <View style={styles.filterList}>
          <Input
            placeholder="Search filter values"
            value={filterSearch}
            onChangeText={setFilterSearch}
            leftIcon={<Search size={18} color={colors.muted} />}
          />
          {activeValues.map((value) => {
            const selected = pendingValues.includes(value);
            return (
              <Pressable
                key={value}
                onPress={() => togglePendingValue(value)}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor: selected ? colors.softOrange : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[typography.body, { color: colors.text }]} numberOfLines={2}>
                  {value}
                </Text>
                {selected ? <Check size={17} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  tablePanel: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  resultText: {
    ...typography.caption,
    paddingHorizontal: spacing.xs,
  },
  table: {
    minWidth: columns.reduce((total, column) => total + column.width, 0),
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  headerCell: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  headerText: {
    flex: 1,
    ...typography.label,
  },
  bodyScroll: {
    maxHeight: 510,
  },
  dataRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  dataCell: {
    minHeight: 48,
    justifyContent: 'center',
    borderRightWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cellText: {
    ...typography.caption,
    lineHeight: 16,
  },
  filterList: {
    gap: spacing.sm,
  },
  filterOption: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
  },
});
