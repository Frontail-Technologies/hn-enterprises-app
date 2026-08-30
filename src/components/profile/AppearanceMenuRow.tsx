import { Moon, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SimpleSelect } from '@/components/shared/SimpleSelect';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTheme, type ThemePreference } from '@/context/ThemeContext';

const THEME_PREFERENCE_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

export function AppearanceMenuRow() {
  const { colors, isDark, themePreference, setThemePreference } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.menuRow}>
      {isDark ? <Sun size={17} color={colors.primary} /> : <Moon size={17} color={colors.primary} />}
      <Text style={[styles.menuLabel, { color: colors.text }]}>Appearance</Text>
      <View style={styles.selectWrap}>
        <SimpleSelect
          compact
          borderless
          label="Appearance"
          value={themePreference}
          options={THEME_PREFERENCE_OPTIONS}
          open={open}
          onOpenChange={setOpen}
          onChange={setThemePreference}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuLabel: {
    ...typography.label,
    flex: 1,
    fontSize: 12,
  },
  selectWrap: {
    width: 112,
  },
});
