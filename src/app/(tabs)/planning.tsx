import { router } from 'expo-router';
import { CalendarDays, ClipboardList, FileText } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/shared/AppHeader';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme } from '@/context/ThemeContext';

const options = [
  {
    title: 'Planning',
    description: 'Create or edit today site-wise plan.',
    icon: ClipboardList,
    route: '/planning/plan',
  },
  {
    title: 'DPR',
    description: 'Submit completed work against today plan.',
    icon: FileText,
    route: '/planning/dpr',
  },
] as const;

export default function PlanningEntryScreen() {
  const { colors } = useTheme();

  return (
    <Screen scroll tabBarAware edges={['bottom']} contentStyle={styles.screen}>
      <AppHeader title="DPR / Planning" subtitle="Choose what you want to update" />

      <View style={[styles.infoStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CalendarDays size={19} color={colors.primary} />
        <View style={styles.infoCopy}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Today Workflow</Text>
          <Text style={[typography.caption, { color: colors.muted }]}>
            Morning: create Planning. Evening: submit DPR.
          </Text>
        </View>
      </View>

      <View style={styles.optionList}>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Pressable
              key={option.title}
              onPress={() => router.push(option.route)}
              style={({ pressed }) => [pressed && { opacity: 0.82 }]}
            >
              <Card style={styles.optionCard}>
                <View style={[styles.optionIcon, { backgroundColor: colors.softOrange }]}>
                  <Icon size={23} color={colors.primary} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[typography.caption, { color: colors.muted }]}>{option.description}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  infoStrip: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  optionList: {
    gap: spacing.md,
  },
  optionCard: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  optionTitle: {
    ...typography.h2,
    fontSize: 17,
    lineHeight: 22,
  },
});
