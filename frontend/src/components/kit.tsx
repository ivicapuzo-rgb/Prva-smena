import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { displayDate, shiftDate, todayStr, useApp } from "@/src/app-store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export const Icon = MaterialDesignIcons;
export type IconName = React.ComponentProps<typeof Icon>["name"];

export const tap = () => {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export function Btn({
  label, onPress, icon, variant = "accent", testID, style, loading, disabled,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "accent" | "blue" | "red" | "outline";
  testID: string;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const bg = { accent: colors.accent, blue: colors.blue, red: colors.brandPrimary, outline: colors.surface }[variant];
  const fg = { accent: colors.onAccent, blue: colors.onBlue, red: colors.onBrandPrimary, outline: colors.brandPrimary }[variant];
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
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        variant === "outline" && { borderWidth: 1.5, borderColor: colors.brandPrimary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={20} color={fg} />}
          <Text style={[s.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Card({ children, tone = "red", style, testID }: { children: React.ReactNode; tone?: "red" | "accent"; style?: StyleProp<ViewStyle>; testID?: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View testID={testID} style={[s.card, { borderColor: tone === "red" ? colors.brandPrimary : colors.accent }, style]}>
      {children}
    </View>
  );
}

export function CardTitle({ icon, children }: { icon?: IconName; children: React.ReactNode }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.cardTitleRow}>
      {icon && <Icon name={icon} size={32} color={colors.brandPrimary} />}
      <Text style={s.cardTitle}>{children}</Text>
    </View>
  );
}

export function DateNav() {
  const { date, setDate } = useApp();
  const s = useStyles();
  const { colors } = useTheme();
  const isToday = date === todayStr();
  return (
    <View style={s.dateRow}>
      <Pressable testID="date-prev-button" onPress={() => { tap(); setDate(shiftDate(date, -1)); }} style={s.dateArrow}>
        <Icon name="chevron-left" size={26} color={colors.brandPrimary} />
      </Pressable>
      <Pressable testID="date-today-button" onPress={() => setDate(todayStr())} style={s.dateBox}>
        <Text style={s.dateLabel}>DATUM</Text>
        <View style={s.dateLine}>
          <Text testID="date-value" style={s.dateValue} numberOfLines={1} adjustsFontSizeToFit>{displayDate(date)}</Text>
          <Text style={s.dateToday}>{isToday ? "Danas" : "→ Danas"}</Text>
        </View>
      </Pressable>
      <Pressable testID="date-next-button" onPress={() => { tap(); setDate(shiftDate(date, 1)); }} style={s.dateArrow}>
        <Icon name="chevron-right" size={26} color={colors.brandPrimary} />
      </Pressable>
    </View>
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
      exiting={FadeOutUp.duration(180)}
      style={[s.toast, { pointerEvents: "none", top: insets.top + 8, backgroundColor: toast.kind === "ok" ? colors.surfaceInverse : colors.brandPrimary }]}
      testID="toast"
    >
      <Icon name={toast.kind === "ok" ? "check-circle" : "alert-circle"} size={20} color={toast.kind === "ok" ? colors.success : colors.onBrandPrimary} />
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
        <View style={s.grabber} />
        {children}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  btn: { minHeight: 52, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 16 },
  btnText: { fontFamily: fonts.bold, fontSize: 18, letterSpacing: 0.3 },
  card: { borderWidth: 1.5, borderRadius: 22, padding: 20, gap: 12, backgroundColor: c.surface },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 23, color: c.onSurface, flexShrink: 1 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dateArrow: { width: 52, height: 72, borderRadius: 14, borderWidth: 1, borderColor: c.brandPrimary, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  dateBox: { flex: 1, height: 62, borderRadius: 14, borderWidth: 2, borderColor: c.brandSecondary, paddingHorizontal: 14, justifyContent: "center" },
  dateLabel: { fontFamily: fonts.wide, fontSize: 11, letterSpacing: 2, color: c.onSurfaceTertiary },
  dateLine: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 6 },
  dateValue: { fontFamily: fonts.wide, fontSize: 17, color: c.onSurface, flexShrink: 1 },
  dateToday: { fontFamily: fonts.wide, fontSize: 10, color: c.onSurface, marginBottom: 2 },
  toast: { position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14 },
  toastText: { color: c.onSurfaceInverse, fontFamily: fonts.semibold, fontSize: 16, flex: 1 },
  backdrop: { flex: 1, backgroundColor: c.overlay },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12, maxHeight: "85%" },
  grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: c.surfaceTertiary, marginBottom: 4 },
}));
