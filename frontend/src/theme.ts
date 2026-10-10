// Design tokens (Brutalist industrial). Keys match design_guidelines.json "color".
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#09090B",
  surfaceSecondary: "#F4F4F5",
  onSurfaceSecondary: "#09090B",
  surfaceTertiary: "#E4E4E7",
  onSurfaceTertiary: "#09090B",
  surfaceInverse: "#09090B",
  onSurfaceInverse: "#FFFFFF",
  muted: "#71717A",

  brand: "#F97316",
  onBrand: "#FFFFFF",
  brandPrimary: "#EA580C",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#C2410C",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFEDD5",
  onBrandTertiary: "#9A3412",

  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#EAB308",
  onWarning: "#000000",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#09090B",
  onInfo: "#FFFFFF",

  border: "#E4E4E7",
  borderStrong: "#27272A",
  divider: "#E4E4E7",
};

export type ThemeColors = typeof light;

export const fonts = {
  regular: "Mono",
  bold: "MonoBold",
  display: "MonoXB",
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
