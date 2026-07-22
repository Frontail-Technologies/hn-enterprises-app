import { router } from 'expo-router';
import { ArrowRight, BriefcaseBusiness, MapPin, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';
import { getAssignedProjects } from '@/services/mockData';
import { formatDate } from '@/utils/format';

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');

  const projects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return getAssignedProjects().filter((project) => {
      return !query || [project.name, project.city, project.areaLocation, project.sites.join(' ')].join(' ').toLowerCase().includes(query);
    });
  }, [search]);

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="Projects" subtitle="Search assigned projects and sites" />

      <Input
        placeholder="Search project, city or site"
        value={search}
        onChangeText={setSearch}
        leftIcon={<Search size={18} color={colors.muted} />}
      />

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Project List</Text>
        <Text style={[typography.label, { color: colors.muted }]}>{projects.length} projects</Text>
      </View>

      <View style={styles.list}>
        {projects.map((project) => (
          <Pressable
            key={project.id}
            onPress={() => router.push({ pathname: '/projects/[id]', params: { id: project.id } })}
            style={({ pressed }) => [pressed && { opacity: 0.84 }]}
          >
            <Card style={styles.projectCard}>
              <View style={styles.cardTop}>
                <View style={[styles.projectIcon, { backgroundColor: colors.softOrange }]}>
                  <BriefcaseBusiness size={20} color={colors.primary} />
                </View>
                <View style={styles.projectTitle}>
                  <Text style={[styles.projectName, { color: colors.text }]} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <View style={styles.metaLine}>
                    <MapPin size={13} color={colors.muted} />
                    <Text style={[typography.label, { color: colors.muted }]} numberOfLines={1}>
                      {project.city} : {project.areaLocation}
                    </Text>
                  </View>
                </View>
                <ArrowRight size={17} color={colors.primary} />
              </View>

              <View style={[styles.metrics, { borderTopColor: colors.border }]}>
                <Metric label="Sites" value={String(project.sitesCount)} />
                <Metric label="Pipe Targets" value="5" />
                <Metric label="Contract" value={project.contractValue} />
              </View>

              <Text style={[typography.label, { color: colors.muted }]}>Last activity: {formatDate(project.lastActivity)}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[typography.label, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: 104,
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
  projectCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  projectIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  projectTitle: {
    flex: 1,
    gap: spacing.xs,
  },
  projectName: {
    ...typography.bodyMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  metricValue: {
    ...typography.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
  },
});
