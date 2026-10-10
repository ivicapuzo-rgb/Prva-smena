import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, IconName, tap } from "@/src/components/kit";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: "index", label: "SMENA", icon: "gas-station-outline" },
  { name: "vozila", label: "VOZILA", icon: "bus" },
  { name: "izvestaj", label: "IZVEŠTAJ", icon: "chart-bar" },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.bar, { paddingBottom: insets.bottom + 8 }]}>
      {state.routes.map((route, i) => {
        const t = TABS.find((x) => x.name === route.name);
        if (!t) return null;
        const active = state.index === i;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${t.name}`}
            onPress={() => {
              tap();
              if (!active) navigation.navigate(route.name);
            }}
            style={[s.item, active && { backgroundColor: colors.brandPrimary }]}
          >
            <Icon name={t.icon} size={22} color={active ? colors.onBrandPrimary : colors.muted} />
            <Text style={[s.label, { color: active ? colors.onBrandPrimary : colors.muted }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brandPrimary}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="fuelpump" />
          <NativeTabs.Trigger.Label>Smena</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="vozila">
          <NativeTabs.Trigger.Icon sf="bus" />
          <NativeTabs.Trigger.Label>Vozila</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="izvestaj">
          <NativeTabs.Trigger.Icon sf="chart.bar" />
          <NativeTabs.Trigger.Label>Izveštaj</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vozila" />
      <Tabs.Screen name="izvestaj" />
    </Tabs>
  );
}

const useStyles = makeStyles((c) => ({
  bar: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 8, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
  item: { flex: 1, height: 58, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 2 },
  label: { fontFamily: fonts.bold, fontSize: 15, letterSpacing: 0.3 },
}));
