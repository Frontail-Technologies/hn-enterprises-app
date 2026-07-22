import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Building2, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { KeyValueSection } from '@/components/shared/KeyValueSection';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { getProjectById, type ProjectSiteRecord } from '@/services/mockData';
import { formatDate } from '@/utils/format';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const project = getProjectById(id);

  if (!project) {
    return (
      <Screen edges={['bottom']}>
        <AppHeader title="Project" left={<BackButton />} />
        <Text style={[typography.body, { color: colors.muted }]}>Project not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title={project.name} subtitle={`${project.city} : ${project.areaLocation}`} left={<BackButton />} />

      <Card style={styles.heroCard}>
        <View style={[styles.heroIcon, { backgroundColor: colors.softOrange }]}>
          <Building2 size={24} color={colors.primary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{project.projectType}</Text>
          <View style={styles.heroMeta}>
            <MapPin size={13} color={colors.muted} />
            <Text style={[typography.label, { color: colors.muted }]} numberOfLines={1}>
              {project.city} : {project.areaLocation}
            </Text>
          </View>
        </View>
      </Card>

      <KeyValueSection
        title="Project Information"
        items={[
          { label: 'Client', value: project.client },
          { label: 'Consultant', value: project.consultant },
          { label: 'Contractor', value: project.contractor },
          { label: 'Project Type', value: project.projectType },
          { label: 'City', value: project.city },
          { label: 'Area / Location', value: project.areaLocation },
          { label: 'Start Date', value: formatDate(project.startDate) },
          { label: 'End Date', value: formatDate(project.endDate) },
          { label: 'Contract Value', value: project.contractValue },
          { label: 'Project Manager', value: project.projectManager },
          { label: 'Description', value: project.description },
        ]}
      />

      <KeyValueSection
        title="Contract Details"
        items={[
          { label: 'Contract ID', value: project.contractId },
          { label: 'Client', value: project.client },
          { label: 'Consultant', value: project.consultant },
          { label: 'Contractor', value: project.contractor },
          { label: 'Contract Value', value: project.contractValue },
          { label: 'Start Date', value: formatDate(project.startDate) },
          { label: 'Planned End Date', value: formatDate(project.plannedEndDate) },
          { label: 'Billing Method', value: project.billingMethod },
        ]}
      />

      <KeyValueSection
        title="Operational Targets"
        items={[
          { label: 'Planned Customers', value: project.targets.plannedCustomers },
          { label: 'Planned Surveys', value: project.targets.plannedSurveys },
          { label: 'Planned Plumbing/GI', value: project.targets.plannedPlumbingGi },
          { label: 'Planned GC', value: project.targets.plannedGc },
          { label: 'Planned Commissioning', value: project.targets.plannedCommissioning },
          { label: 'Planned Conversion', value: project.targets.plannedConversion },
          { label: 'Planned JMR', value: project.targets.plannedJmr },
        ]}
      />

      <KeyValueSection
        title="Pipe-Size Targets"
        items={[
          { label: '20MM', value: project.pipeTargets.pipe20Mm },
          { label: '32MM', value: project.pipeTargets.pipe32Mm },
          { label: '63MM', value: project.pipeTargets.pipe63Mm },
          { label: '90MM', value: project.pipeTargets.pipe90Mm },
          { label: '125MM', value: project.pipeTargets.pipe125Mm },
        ]}
      />

      <Card style={styles.sitesCard}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sites</Text>
          <Text style={[typography.label, { color: colors.muted }]}>{project.siteRecords.length} sites</Text>
        </View>
        <View style={[styles.sitesHeader, { borderColor: colors.border }]}>
          <Text style={[styles.siteHeaderText, styles.noColumn, { color: colors.muted }]}>No.</Text>
          <Text style={[styles.siteHeaderText, styles.siteColumn, { color: colors.muted }]}>Site</Text>
          <Text style={[styles.siteHeaderText, styles.statusColumn, { color: colors.muted }]}>Status</Text>
        </View>
        {project.siteRecords.map((site, index) => (
          <SiteRow key={site.id} site={site} index={index} />
        ))}
      </Card>
    </Screen>
  );
}

function SiteRow({ site, index }: { site: ProjectSiteRecord; index: number }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.siteRow, { borderColor: colors.border }]}>
      <Text style={[styles.noColumn, styles.siteIndex, { color: colors.text }]}>{index + 1}</Text>
      <View style={styles.siteColumn}>
        <Text style={[styles.siteName, { color: colors.text }]}>{site.siteName}</Text>
        <Text style={[typography.caption, { color: colors.muted }]}>
          {site.siteCode} : {site.city}
        </Text>
        <Text style={[typography.caption, { color: colors.muted }]} numberOfLines={2}>
          {site.address}
        </Text>
        <Text style={[typography.caption, { color: colors.text }]}>
          Planned: {site.plannedConnections} : {site.supervisor}
        </Text>
      </View>
      <View style={styles.statusColumn}>
        <StatusBadge status={site.status} />
      </View>
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
    gap: spacing.md,
    paddingBottom: 104,
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  heroIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  heroTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sitesCard: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  sitesHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: spacing.xs,
  },
  siteHeaderText: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 14,
  },
  siteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
  },
  noColumn: {
    width: 30,
  },
  siteColumn: {
    flex: 1,
    gap: 2,
  },
  statusColumn: {
    width: 92,
    alignItems: 'flex-end',
  },
  siteIndex: {
    ...typography.label,
  },
  siteName: {
    ...typography.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
  },
});
