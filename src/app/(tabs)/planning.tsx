import { router } from "expo-router";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { Screen } from "@/components/ui/Screen";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import { guardNavigation } from "@/lib/navigation";

type PlanningLink = {
  title: string;
  icon: LucideIcon;
  route: "/planning/dpr" | "/planning/plan";
};

const links: PlanningLink[] = [
  {
    title: "Daily Progress Reports",
    icon: FileText,
    route: "/planning/dpr",
  },
  {
    title: "Work Planning",
    icon: ClipboardList,
    route: "/planning/plan",
  },
];

export default function PlanningEntryScreen() {
  const { colors } = useTheme();

  return (
    <Screen scroll edges={[]} refreshable={false} contentStyle={styles.screen}>
      <AppHeader title="Planning/DPR" />

      <View style={styles.list}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Pressable
              key={link.route}
              onPress={() => guardNavigation(() => router.push(link.route))}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.78 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.softBlue }]}>
                <Icon size={19} color={colors.accent} />
              </View>
              <View style={styles.copy}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {link.title}
                </Text>
              </View>
              <ChevronRight size={19} color={colors.muted} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  icon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.bodyMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
  },
});
