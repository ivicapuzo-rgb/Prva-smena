import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform } from "react-native";

import { Icon } from "@/src/components/ui";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, useTheme } from "@/src/theme";

export default function TabsLayout() {
  const { colors } = useTheme();
  if (usesNativeTabs) {
    return (
      <NativeTabs tintColor={colors.brandPrimary}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house.fill" />
          <NativeTabs.Trigger.Label>Почетна</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="pumps">
          <NativeTabs.Trigger.Icon sf="gauge.with.dots.needle.33percent" />
          <NativeTabs.Trigger.Label>Аутомати</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="fuel">
          <NativeTabs.Trigger.Icon sf="fuelpump.fill" />
          <NativeTabs.Trigger.Label>Точење</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <NativeTabs.Trigger.Icon sf="clock.fill" />
          <NativeTabs.Trigger.Label>Историја</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.onSurfaceInverse,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.surfaceInverse,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 2,
          borderTopColor: colors.borderStrong,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Почетна", tabBarButtonTestID: "tab-home", tabBarIcon: ({ color }) => <Icon name="home" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="pumps"
        options={{ title: "Аутомати", tabBarButtonTestID: "tab-pumps", tabBarIcon: ({ color }) => <Icon name="gauge" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="fuel"
        options={{ title: "Точење", tabBarButtonTestID: "tab-fuel", tabBarIcon: ({ color }) => <Icon name="gas-station" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: "Историја", tabBarButtonTestID: "tab-history", tabBarIcon: ({ color }) => <Icon name="history" size={24} color={color} /> }}
      />
    </Tabs>
  );
}
