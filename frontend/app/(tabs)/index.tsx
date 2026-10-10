import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { nowTime, num, useApp } from "@/src/app-store";
import { Btn, Card, DateNav, Icon, Sheet, tap } from "@/src/components/kit";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Smena() {
  const { day, buses, addArrival, removeArrival, showToast, logout } = useApp();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();

  const [bus, setBus] = useState("");
  const [pump, setPump] = useState<number | null>(null);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [time, setTime] = useState(nowTime());
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(nowTime()), 15000);
    return () => clearInterval(t);
  }, []);

  const known = buses.includes(bus);
  const suggestions = useMemo(
    () => (bus.length >= 2 && !known ? buses.filter((b) => b.startsWith(bus)).slice(0, 5) : []),
    [bus, known, buses],
  );
  const recent = [...day.arrivals].reverse().slice(0, 5);

  const save = () => {
    if (!bus) return showToast("Unesite garažni broj", "err");
    if (!known) return showToast(`Vozilo ${bus} nije na listi`, "err");
    if (day.arrivals.some((a) => a.bus === bus)) return showToast(`Vozilo ${bus} je već uneto`, "err");
    if (!pump) return showToast("Izaberite mesto sipanja", "err");
    if (num(qty) <= 0) return showToast("Unesite točenu količinu", "err");
    const t = nowTime();
    addArrival({ bus, pump, qty: qty.replace(".", ","), time: t, note: note.trim() });
    showToast(`Sačuvano: ${bus} · pumpa ${pump} · ${qty} L`);
    setBus("");
    setPump(null);
    setQty("");
    setNote("");
    setTime(t);
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomChrome + 24 }}>
        <View style={[s.hero, { height: 256 + insets.top }]}>
          <Image source={require("../../assets/images/hero.webp")} style={s.fill} contentFit="cover" contentPosition="top" />
          <View style={[s.fill, s.shade]} />
          <View style={[s.badges, { top: insets.top + 16 }]}>
            <View style={s.syncBadge} testID="sync-badge">
              <Icon name="cloud-check-outline" size={14} color={colors.success} />
              <Text style={[s.badgeText, { color: colors.success }]}>SINHRONIZOVANO</Text>
            </View>
            <Pressable testID="admin-badge" onPress={() => setAdminOpen(true)} style={s.adminBadge}>
              <Icon name="shield-check-outline" size={14} color={colors.onSurfaceInverse} />
              <Text style={s.badgeText}>ADMIN</Text>
            </Pressable>
          </View>
          <Text style={s.heroTitle}>PRVA SMENA</Text>
        </View>

        <View style={s.body}>
          <DateNav />
          <Animated.View entering={FadeInDown.duration(300)} style={s.counter} testID="arrived-counter">
            <View style={s.counterHead}>
              <View style={s.dot} />
              <Text style={s.counterLabel}>DOŠLO</Text>
            </View>
            <Text testID="arrived-count" style={s.counterValue}>{day.arrivals.length}</Text>
          </Animated.View>

          <Card tone="accent" testID="arrival-form">
            <Text style={s.formTitle}>Unesi vozilo</Text>
            <View style={{ gap: 6 }}>
              <Text style={s.label}>Garažni broj</Text>
              <TextInput
                testID="arrival-bus-input"
                value={bus}
                onChangeText={(t) => setBus(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="npr. 7000"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
                style={[s.input, s.busInput, bus && !known && suggestions.length === 0 ? { borderColor: colors.brandPrimary } : null]}
              />
              {suggestions.length > 0 && (
                <View style={s.suggestRow}>
                  {suggestions.map((b) => (
                    <Pressable key={b} testID={`suggest-${b}`} onPress={() => { tap(); setBus(b); }} style={s.suggest}>
                      <Text style={s.suggestText}>{b}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={{ gap: 8 }}>
              <Text style={s.label}>Mesto sipanja (1-8)</Text>
              <View style={s.pumpGrid}>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((p) => (
                  <Pressable
                    key={p}
                    testID={`pump-chip-${p}`}
                    onPress={() => { tap(); setPump(p); }}
                    style={[s.pumpChip, pump === p && { backgroundColor: colors.accent }]}
                  >
                    <Text style={s.pumpText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={s.twoCols}>
              <View style={s.col}>
                <Text style={s.label}>Točena količina (L)</Text>
                <TextInput
                  testID="arrival-qty-input"
                  value={qty}
                  onChangeText={(t) => setQty(t.replace(/[^0-9.,]/g, ""))}
                  placeholder="23,45"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                  style={s.input}
                />
              </View>
              <View style={s.col}>
                <Text style={s.label}>Vreme (automatski)</Text>
                <View style={[s.input, s.timeBox]}>
                  <Text testID="arrival-time" style={s.timeText}>{time}</Text>
                  <Icon name="clock-outline" size={22} color={colors.onSurface} />
                </View>
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={s.label}>Napomena (nije obavezno)</Text>
              <TextInput
                testID="arrival-note-input"
                value={note}
                onChangeText={setNote}
                placeholder="npr. kartica ne radi"
                placeholderTextColor={colors.placeholder}
                style={[s.input, s.noteInput]}
              />
            </View>

            <Btn testID="arrival-save-button" label="SAČUVAJ DOLAZAK" icon="truck-fast-outline" onPress={save} />
          </Card>

          {recent.length > 0 && (
            <Card tone="accent" testID="recent-card">
              <Text style={s.recentTitle}>Poslednji dolasci</Text>
              {recent.map((a) => (
                <Animated.View key={a.id} layout={LinearTransition} style={s.recentRow} testID={`recent-${a.bus}`}>
                  <Text style={s.recentTime}>{a.time}</Text>
                  <Text style={s.recentBus}>{a.bus}</Text>
                  <Text style={s.recentInfo} numberOfLines={1}>P{a.pump} · {a.qty} L{a.note ? ` · ${a.note}` : ""}</Text>
                  <Pressable testID={`recent-delete-${a.bus}`} hitSlop={8} onPress={() => { removeArrival(a.id); showToast(`Obrisano: ${a.bus}`); }} style={s.recentDel}>
                    <Icon name="close" size={20} color={colors.brandPrimary} />
                  </Pressable>
                </Animated.View>
              ))}
            </Card>
          )}
        </View>
      </KeyboardAwareScrollView>

      <Sheet visible={adminOpen} onClose={() => setAdminOpen(false)} testID="admin-sheet">
        <Text style={s.formTitle}>Admin</Text>
        <Text style={s.label}>Prijavljeni ste kao administrator.</Text>
        <Btn testID="logout-button" label="ODJAVI SE" icon="logout" variant="red" onPress={() => { setAdminOpen(false); logout(); }} />
        <Btn testID="admin-close-button" label="ZATVORI" variant="outline" onPress={() => setAdminOpen(false)} />
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { justifyContent: "flex-end", overflow: "hidden", backgroundColor: c.surfaceInverse },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  shade: { backgroundColor: c.overlay },
  badges: { position: "absolute", left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  syncBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.badgeDark, paddingHorizontal: 12, height: 26, borderRadius: 13 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.surfaceInverse, paddingHorizontal: 12, height: 26, borderRadius: 13 },
  badgeText: { fontFamily: fonts.bold, fontSize: 13, color: c.onSurfaceInverse },
  heroTitle: { fontFamily: fonts.display, fontSize: 58, color: c.heroTitle, paddingHorizontal: 20, paddingBottom: 12 },
  body: { padding: 16, paddingTop: 24, gap: 24 },
  counter: { alignSelf: "flex-start", width: 88, height: 88, borderRadius: 18, borderWidth: 1.5, borderColor: c.accent, alignItems: "center", justifyContent: "center" },
  counterHead: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.success },
  counterLabel: { fontFamily: fonts.wide, fontSize: 10, color: c.onSurface },
  counterValue: { fontFamily: fonts.display, fontSize: 36, color: c.onSurface },
  formTitle: { fontFamily: fonts.display, fontSize: 46, color: c.onSurface },
  label: { fontFamily: fonts.semibold, fontSize: 16, color: c.onSurfaceTertiary },
  input: { height: 58, borderWidth: 2, borderColor: c.borderStrong, borderRadius: 12, paddingHorizontal: 16, fontFamily: fonts.semibold, fontSize: 22, color: c.onSurface },
  busInput: { width: "60%" },
  noteInput: { fontSize: 18 },
  suggestRow: { flexDirection: "row", gap: 8, flexWrap: "nowrap", overflow: "hidden" },
  suggest: { height: 40, paddingHorizontal: 12, borderRadius: 10, backgroundColor: c.accentSoft, borderWidth: 1, borderColor: c.accent, justifyContent: "center", flexShrink: 0 },
  suggestText: { fontFamily: fonts.bold, fontSize: 18, color: c.onSurface },
  pumpGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  pumpChip: { width: "21%", flexGrow: 1, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: c.accent, alignItems: "center", justifyContent: "center" },
  pumpText: { fontFamily: fonts.wide, fontSize: 20, color: c.onSurface },
  twoCols: { flexDirection: "row", gap: 12 },
  col: { flex: 1, gap: 6 },
  timeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  timeText: { fontFamily: fonts.semibold, fontSize: 22, color: c.onSurface },
  recentTitle: { fontFamily: fonts.semibold, fontSize: 23, color: c.onSurface },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, borderTopWidth: 1, borderTopColor: c.divider },
  recentTime: { fontFamily: fonts.wide, fontSize: 12, color: c.muted, width: 52 },
  recentBus: { fontFamily: fonts.bold, fontSize: 20, color: c.onSurface, width: 52 },
  recentInfo: { fontFamily: fonts.medium, fontSize: 16, color: c.onSurfaceTertiary, flex: 1 },
  recentDel: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
}));
