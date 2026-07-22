import { router } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Route,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/shared/AppHeader";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { radius, spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { useTheme } from "@/context/ThemeContext";
import {
  getSupervisorStats,
  type SupervisorStat,
  type SupervisorStatTone,
} from "@/services/mobileStats";

const statIcons = [ClipboardList, CheckCircle2, ClipboardList, Route] as const;

export default function AllStatsScreen() {
  const stats = getSupervisorStats();

  return (
    <Screen scroll edges={["bottom"]} contentStyle={styles.screen}>
      <AppHeader
        title="All Stats"
        subtitle="Supervisor work progress summary"
        left={<BackButton />}
      />
      <View style={styles.grid}>
        {stats.map((stat, index) => (
          <Pressable
            key={stat.label}
            onPress={() =>
              router.push({
                pathname: "/stats/[type]",
                params: { type: stat.id },
              })
            }
            style={({ pressed }) => [
              styles.cardPressable,
              pressed && { opacity: 0.72 },
            ]}
          >
            <StatCard stat={stat} icon={statIcons[index % statIcons.length]} />
          </Pressable>
        ))}
      </View>
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

function StatCard({
  stat,
  icon: Icon,
}: {
  stat: SupervisorStat;
  icon: typeof ClipboardList;
}) {
  const { colors } = useTheme();
  const accentColor = getAccentColor(stat.tone, colors);
  const softColor = getSoftColor(stat.tone, colors);

  return (
    <Card style={styles.card}>
      <Text style={[styles.label, { color: colors.text }]} numberOfLines={2}>
        {stat.label}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.value, { color: accentColor }]}>{stat.value}</Text>
        <View style={[styles.iconBox, { backgroundColor: softColor }]}>
          <Icon size={18} color={accentColor} />
        </View>
      </View>
    </Card>
  );
}

function getAccentColor(
  tone: SupervisorStatTone,
  colors: ReturnType<typeof useTheme>["colors"],
) {
  if (tone === "red") return colors.red;
  if (tone === "green") return colors.green;
  if (tone === "orange") return colors.primary;
  return colors.blue;
}

function getSoftColor(
  tone: SupervisorStatTone,
  colors: ReturnType<typeof useTheme>["colors"],
) {
  if (tone === "red") return "#FEE2E2";
  if (tone === "green") return "#DCFCE7";
  if (tone === "orange") return colors.softOrange;
  return colors.softBlue;
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  card: {
    width: "100%",
    minHeight: 106,
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  cardPressable: {
    width: "31.6%",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  label: {
    ...typography.label,
    fontSize: 11,
    lineHeight: 14,
  },
  iconBox: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },
  value: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    lineHeight: 29,
  },
});
