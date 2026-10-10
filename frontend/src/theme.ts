// Design tokens (Brutalist industrial). Keys match design_guidelines.json "color".
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#0A0A0A",
  surfaceSecondary: "#F7F7F7",
  onSurfaceSecondary: "#0A0A0A",
  surfaceTertiary: "#EEEEEE",
  onSurfaceTertiary: "#3A3A3A",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#FFFFFF",
  muted: "#9A9A9A",
  placeholder: "#C4C4C4",

  brand: "#E10600",
  onBrand: "#FFFFFF",
  brandPrimary: "#E10600",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#C8102E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FDECEC",
  onBrandTertiary: "#C8102E",

  accent: "#F2A623",
  onAccent: "#0A0A0A",
  accentSoft: "#FFF6E5",
  blue: "#1565C0",
  onBlue: "#FFFFFF",
  heroTitle: "#F5A623",
  overlay: "rgba(0,0,0,0.45)",
  badgeDark: "rgba(20,20,20,0.75)",

  success: "#22C55E",
  onSuccess: "#FFFFFF",
  warning: "#F2A623",
  onWarning: "#000000",
  error: "#E10600",
  onError: "#FFFFFF",
  info: "#1565C0",
  onInfo: "#FFFFFF",

  border: "#E5E5E5",
  borderStrong: "#111111",
  divider: "#EEEEEE",
};

export type ThemeColors = typeof light;

export const fonts = {
  display: "Anton",
  wide: "Michroma",
  medium: "BarlowM",
  semibold: "BarlowSB",
  bold: "BarlowB",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
