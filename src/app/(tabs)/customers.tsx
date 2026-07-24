import { router } from 'expo-router';
import { Filter, Search } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { ColumnFilterSheet } from '@/components/shared/ColumnFilterSheet';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useColumnFilters } from '@/hooks/useColumnFilters';
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

  const {
    activeColumn,
    pendingValues,
    filterSearch,
    setFilterSearch,
    activeValues,
    matchesFilters,
    isColumnActive,
    openFilter,
    closeFilter,
    togglePendingValue,
    applyFilter,
    clearFilter,
  } = useColumnFilters<CustomerGridRow, ColumnKey>(columns, rows);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch = query
        ? columns.some((column) => String(row[column.key]).toLowerCase().includes(query))
        : true;

      return matchesSearch && matchesFilters(row);
    });
  }, [matchesFilters, rows, search]);

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
                const active = isColumnActive(column.key);
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

      <ColumnFilterSheet
        activeColumn={activeColumn}
        activeValues={activeValues}
        pendingValues={pendingValues}
        filterSearch={filterSearch}
        onSearchChange={setFilterSearch}
        onToggleValue={togglePendingValue}
        onClose={closeFilter}
        onClear={clearFilter}
        onApply={applyFilter}
      />
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
});
