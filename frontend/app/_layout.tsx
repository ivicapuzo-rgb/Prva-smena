import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { ToastHost } from "@/src/components/ui";
import { queryClient } from "@/src/query-client";
import { AppProvider, useApp } from "@/src/store";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function RootStack() {
  const { ready, unlocked } = useApp();
  const { colors } = useTheme();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
      </View>
    );
  }
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
        <Stack.Protected guard={!unlocked}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={unlocked}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="buses" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Mono: require("../assets/fonts/JetBrainsMono-Regular.ttf"),
    MonoBold: require("../assets/fonts/JetBrainsMono-Bold.ttf"),
    MonoXB: require("../assets/fonts/JetBrainsMono-ExtraBold.ttf"),
  });
  if (!loaded) return null;
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AppProvider>
              <StatusBar style="dark" />
              <RootStack />
            </AppProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
