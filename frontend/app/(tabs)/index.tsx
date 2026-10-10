import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Icon, tap } from "@/src/components/ui";
import { exportExcel, exportPdf } from "@/src/export";
import { usesNativeTabs } from "@/src/navigation";
import { displayDate, fmt, shiftDate, todayStr, totalDiff, totalLiters, useApp } from "@/src/store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Home() {
  const { date, setDate, shift, buses, logout, showToast } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();
  const [busy, setBusy] = useState<"x" | "p" | null>(null);

  const diff = totalDiff(shift);
  const liters = totalLiters(shift);
  const count = Object.keys(shift.entries).length;
  const badCards = Object.values(shift.entries).filter((e) => e.card === "не").length;
  const isToday = date === todayStr();

  const doExport = async (kind: "x" | "p") => {
    setBusy(kind);
    try {
      if (kind === "x") await exportExcel(shift, buses);
      else await exportPdf(shift, buses);
    } catch {
      showToast("Грешка при извозу", "err");
    }
    setBusy(null);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>СМЕНА 07h – 15h · СП НОВИ БЕОГРАД</Text>
        </View>
        <Pressable testID="home-buses-button" onPress={() => router.push("/buses")} style={s.iconBtn} hitSlop={6}>
          <Icon name="bus" size={24} color={colors.onSurface} />
        </Pressable>
        <Pressable testID="home-logout-button" onPress={logout} style={s.iconBtn} hitSlop={6}>
          <Icon name="logout" size={24} color={colors.onSurface} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomChrome + 24 }]}>
        <Animated.View entering={FadeInDown.duration(300)} style={s.dateRow}>
          <Pressable testID="date-prev-button" onPress={() => { tap(); setDate(shiftDate(date, -1)); }} style={s.arrow}>
            <Icon name="chevron-left" size={32} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={s.dateLabel}>{isToday ? "ДАНАС" : "ДАТУМ"}</Text>
            <Text testID="home-date" style={s.date}>{displayDate(date)}</Text>
          </View>
          <Pressable testID="date-next-button" onPress={() => { tap(); setDate(shiftDate(date, 1)); }} style={s.arrow}>
            <Icon name="chevron-right" size={32} color={colors.onSurface} />
          </Pressable>
        </Animated.View>
        {!isToday && (
          <Pressable testID="date-today-button" onPress={() => setDate(todayStr())} style={s.todayLink}>
            <Text style={s.todayText}>← НАЗАД НА ДАНАС</Text>
          </Pressable>
        )}

        <Animated.View entering={FadeInDown.delay(60).duration(300)} style={s.hero}>
          <Text style={s.heroLabel}>УКУПНА РАЗЛИКА (АУТОМАТИ)</Text>
          <Text testID="home-total-diff" style={s.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(diff)}
          </Text>
          <Text style={s.heroUnit}>ЛИТАРА</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(300)} style={s.stats}>
          <View style={s.stat}>
            <Text style={s.statLabel}>ТОЧЕНО</Text>
            <Text testID="home-total-liters" style={s.statValue}>{fmt(liters)}</Text>
          </View>
          <View style={[s.stat, s.statMid]}>
            <Text style={s.statLabel}>ВОЗИЛА</Text>
            <Text testID="home-bus-count" style={s.statValue}>{count}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>КАРТ. НЕ</Text>
            <Text testID="home-bad-cards" style={[s.statValue, badCards ? { color: colors.error } : null]}>{badCards}</Text>
          </View>
        </Animated.View>
        <View style={s.deltaRow}>
          <Text style={s.deltaLabel}>ОДСТУПАЊЕ (АУТОМАТИ − ТОЧЕНО)</Text>
          <Text testID="home-delta" style={[s.deltaValue, Math.abs(diff - liters) > 0.009 ? { color: colors.brandSecondary } : null]}>
            {fmt(diff - liters)}
          </Text>
        </View>

        <Animated.View entering={FadeInDown.delay(180).duration(300)} style={s.blocks}>
          <Pressable testID="home-nav-pumps" onPress={() => router.push("/pumps")} style={({ pressed }) => [s.block, s.blockDark, pressed && { opacity: 0.8 }]}>
            <Icon name="gauge" size={36} color={colors.onSurfaceInverse} />
            <Text style={s.blockTitleInv}>АУТОМАТИ</Text>
            <Text style={s.blockSubInv}>Почетно / завршно стање 1–8</Text>
          </Pressable>
          <Pressable testID="home-nav-fuel" onPress={() => router.push("/fuel")} style={({ pressed }) => [s.block, s.blockBrand, pressed && { opacity: 0.8 }]}>
            <Icon name="gas-station" size={36} color={colors.onBrandPrimary} />
            <Text style={s.blockTitleInv}>ТОЧЕЊЕ</Text>
            <Text style={s.blockSubInv}>Унос по гаражном броју</Text>
          </Pressable>
        </Animated.View>

        <View style={s.exportRow}>
          <Btn testID="home-export-excel" label="EXCEL" icon="file-excel" variant="outline" style={{ flex: 1 }} loading={busy === "x"} onPress={() => doExport("x")} />
          <Btn testID="home-export-pdf" label="PDF" icon="file-pdf-box" variant="outline" style={{ flex: 1 }} loading={busy === "p"} onPress={() => doExport("p")} />
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: c.borderStrong,
    backgroundColor: c.surface,
  },
  kicker: { fontFamily: fonts.bold, fontSize: 12, color: c.onSurface, letterSpacing: 0.5 },
  iconBtn: { width: 48, height: 48, borderWidth: 2, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, gap: 16 },
  dateRow: { flexDirection: "row", alignItems: "center", borderWidth: 2, borderColor: c.borderStrong },
  arrow: { width: 56, height: 72, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  dateLabel: { fontFamily: fonts.bold, fontSize: 12, color: c.brandPrimary, letterSpacing: 1 },
  date: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  todayLink: { alignSelf: "center", paddingVertical: 4 },
  todayText: { fontFamily: fonts.bold, fontSize: 13, color: c.brandSecondary },
  hero: { backgroundColor: c.surfaceInverse, padding: 24, gap: 4 },
  heroLabel: { fontFamily: fonts.bold, fontSize: 12, color: c.brand, letterSpacing: 1 },
  heroValue: { fontFamily: fonts.display, fontSize: 56, color: c.onSurfaceInverse },
  heroUnit: { fontFamily: fonts.bold, fontSize: 12, color: c.muted },
  stats: { flexDirection: "row", borderWidth: 2, borderColor: c.borderStrong },
  stat: { flex: 1, padding: 12, gap: 4 },
  statMid: { borderLeftWidth: 2, borderRightWidth: 2, borderColor: c.borderStrong },
  statLabel: { fontFamily: fonts.bold, fontSize: 11, color: c.muted },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: c.onSurface },
  deltaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: c.brandTertiary, padding: 12 },
  deltaLabel: { fontFamily: fonts.bold, fontSize: 11, color: c.onBrandTertiary, flex: 1 },
  deltaValue: { fontFamily: fonts.display, fontSize: 18, color: c.onBrandTertiary },
  blocks: { flexDirection: "row", gap: 12 },
  block: { flex: 1, padding: 16, minHeight: 150, justifyContent: "flex-end", gap: 6 },
  blockDark: { backgroundColor: c.surfaceInverse },
  blockBrand: { backgroundColor: c.brandPrimary },
  blockTitleInv: { fontFamily: fonts.display, fontSize: 18, color: c.onSurfaceInverse },
  blockSubInv: { fontFamily: fonts.regular, fontSize: 11, color: c.onSurfaceInverse },
  exportRow: { flexDirection: "row", gap: 12 },
}));
