export const colors = {
  // Page canvas - never used as a component fill.
  background: "#F9F6EE",
  // Primary content surface (cards, sheets, table rows, inputs). `card` is
  // kept as an alias so existing references keep working unchanged.
  surface: "#FFFFFF",
  card: "#FFFFFF",
  // Secondary/recessed surface - filter bars, table headers, segmented-
  // control tracks. Deliberately its own tone, not a reuse of `background`.
  surfaceMuted: "#F1EBDE",
  primary: "#FF7900",
  primaryDark: "#E85F00",
  accent: "#004B82",
  // Soft accent tint for selected/neutral-important context - same value as
  // `softOrange`, named for where it's used semantically.
  accentSoft: "#FFF0E2",
  text: "#102033",
  muted: "#64748B",
  border: "#E6E1D9",
  // More visible border for focus states and stronger separators.
  borderStrong: "#D9CFBD",
  softOrange: "#FFF0E2",
  softBlue: "#EAF4FF",
  green: "#16A34A",
  red: "#DC2626",
  blue: "#0057B8",
  amber: "#D97706",
};

export type AppColors = typeof colors;
