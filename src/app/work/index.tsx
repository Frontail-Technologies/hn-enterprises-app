import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { FilterChip } from '@/components/shared/FilterChip';
import { WorkProgressCard } from '@/components/shared/WorkProgressCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { useWorkQueue } from '@/hooks/useWorkProgress';
import type { WorkProgressStatus } from '@/services/mockData';

type WorkFilter = 'All' | WorkProgressStatus;

export default function WorkQueueScreen() {
  const { colors } = useTheme();
  const { items: workProgressRecords, isLoading } = useWorkQueue();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<WorkFilter>('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const projectOptions = useMemo(() => ['All', ...Array.from(new Set(workProgressRecords.map((record) => record.projectName)))], [workProgressRecords]);
  const siteOptions = useMemo(() => ['All', ...Array.from(new Set(workProgressRecords.map((record) => record.siteArea)))], [workProgressRecords]);
  const stageOptions = useMemo(() => ['All', ...Array.from(new Set(workProgressRecords.map((record) => record.currentStage)))], [workProgressRecords]);

  const records = useMemo(() => {
    const query = search.trim().toLowerCase();
    const statusFiltered = workProgressRecords.filter((record) => {
      const matchesStatus = filter === 'All' || record.status === filter;
      const matchesProject = projectFilter === 'All' || record.projectName === projectFilter;
      const matchesSite = siteFilter === 'All' || record.siteArea === siteFilter;
      const matchesStage = stageFilter === 'All' || record.currentStage === stageFilter;

      return matchesStatus && matchesProject && matchesSite && matchesStage;
    });

    if (!query) return statusFiltered;

    return statusFiltered.filter((record) =>
      [
        record.customerName,
        record.bpTrNumber,
        record.mobileNumber,
        record.projectName,
        record.siteArea,
        record.currentStage,
        record.nextRequiredAction,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [filter, projectFilter, search, siteFilter, stageFilter, workProgressRecords]);

  const inProgressCount = workProgressRecords.filter((record) => record.status === 'In Progress').length;
  const sentBackCount = workProgressRecords.filter((record) => record.status === 'Sent Back').length;
  const pendingEvidenceCount = workProgressRecords.reduce((total, record) => total + record.evidenceCount, 0);

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader
        title="Work Queue"
        subtitle={`${records.length} work-progress records`}
        left={
          <Pressable onPress={() => router.back()} style={styles.headerAction}>
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <View style={styles.summaryGrid}>
        <SummaryTile label="In Progress" value={String(inProgressCount)} color={colors.accent} />
        <SummaryTile label="Sent Back" value={String(sentBackCount)} color={colors.primary} />
        <SummaryTile label="Evidence" value={String(pendingEvidenceCount)} color={colors.green} />
      </View>

      <Input
        placeholder="Search customer, BP/TR, stage or site"
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={18} color={colors.muted} />}
      />

      <View style={styles.chips}>
        {(['All', 'In Progress', 'Sent Back', 'On Hold', 'Completed'] as WorkFilter[]).map((item) => (
          <FilterChip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
        ))}
      </View>

      <FilterRow label="Project" options={projectOptions} value={projectFilter} onChange={setProjectFilter} />
      <FilterRow label="Site" options={siteOptions} value={siteFilter} onChange={setSiteFilter} />
      <FilterRow label="Stage" options={stageOptions} value={stageFilter} onChange={setStageFilter} />

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Work Progress</Text>
        <Text style={[typography.label, { color: colors.muted }]}>{records.length} records</Text>
      </View>

      {records.length ? (
        <View style={styles.list}>
          {records.map((record) => (
            <WorkProgressCard key={record.id} record={record} />
          ))}
        </View>
      ) : (
        <EmptyState
          title={isLoading ? 'Loading work queue...' : 'No work-progress records'}
          description={isLoading ? undefined : 'Try changing the filters or check back after a survey is assigned.'}
        />
      )}
    </Screen>
  );
}

function FilterRow({
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

  return (
    <View style={styles.filterBlock}>
      <Text style={[typography.label, { color: colors.muted }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => (
          <FilterChip key={option} label={option} active={value === option} onPress={() => onChange(option)} />
        ))}
      </View>
    </View>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();

  return (
    <Card style={styles.summaryTile}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.muted }]}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 104,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryTile: {
    flex: 1,
    minHeight: 82,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  summaryValue: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    lineHeight: 27,
  },
  summaryLabel: {
    ...typography.label,
    textAlign: 'center',
    fontSize: 11,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterBlock: {
    gap: spacing.sm,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
  list: {
    gap: spacing.md,
  },
});
