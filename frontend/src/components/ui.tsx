import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export const Icon = MaterialDesignIcons;

export const tap = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type BtnProps = {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Icon>["name"];
  variant?: "primary" | "dark" | "outline" | "danger";
  testID: string;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
};

export function Btn({ label, onPress, icon, variant = "primary", testID, style, loading, disabled }: BtnProps) {
  const s = useStyles();
  const { colors } = useTheme();
  const bg = { primary: colors.brandPrimary, dark: colors.surfaceInverse, outline: colors.surface, danger: colors.error }[variant];
  const fg = variant === "outline" ? colors.onSurface : colors.onBrandPrimary;
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={22} color={fg} />}
          <Text style={[s.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function ToastHost() {
  const { toast } = useApp();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const { colors } = useTheme();
  if (!toast) return null;
  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(180)}
      style={[s.toast, { pointerEvents: "none" }, { top: insets.top + 8, backgroundColor: toast.kind === "ok" ? colors.surfaceInverse : colors.error }]}
      testID="toast"
    >
      <Icon name={toast.kind === "ok" ? "check-bold" : "alert"} size={20} color={colors.onSurfaceInverse} />
      <Text style={s.toastText} testID="toast-message">{toast.msg}</Text>
    </Animated.View>
  );
}

export function Sheet({ visible, onClose, children, testID }: { visible: boolean; onClose: () => void; children: React.ReactNode; testID: string }) {
  const insets = useSafeAreaInsets();
  const s = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={s.backdrop} onPress={onClose} testID={`${testID}-backdrop`} />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]} testID={testID}>
        {children}
      </View>
    </Modal>
  );
}

export function SectionLabel({ children }: { children: string }) {
  const s = useStyles();
  return <Text style={s.label}>{children}</Text>;
}

const useStyles = makeStyles((c) => ({
  btn: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: c.borderStrong,
  },
  btnText: { fontFamily: fonts.display, fontSize: 16, letterSpacing: 0.5 },
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: c.borderStrong,
  },
  toastText: { color: c.onSurfaceInverse, fontFamily: fonts.bold, fontSize: 14, flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: c.surface,
    borderTopWidth: 4,
    borderColor: c.brandPrimary,
    padding: 16,
    gap: 12,
    maxHeight: "85%",
  },
  label: { fontFamily: fonts.bold, fontSize: 12, color: c.muted, letterSpacing: 1, textTransform: "uppercase" },
}));
