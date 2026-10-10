import React, { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/src/app-store";
import { Btn, DateNav, Icon, tap } from "@/src/components/kit";
import { DEFAULT_BUSES } from "@/src/data/buses";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, makeStyles, useTheme } from "@/src/theme";

type Filter = "sva" | "dosla" | "nisu";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "sva", label: "Sva" },
  { key: "dosla", label: "Došla" },
  { key: "nisu", label: "Nisu došla" },
];

export default function Vozila() {
  const { buses, setBuses, day, showToast } = useApp();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("sva");
  const [confirmReset, setConfirmReset] = useState(false);

  const arrived = useMemo(() => new Set(day.arrivals.map((a) => a.bus)), [day]);
  const data = useMemo(
    () =>
      buses.filter(
        (b) => (!q || b.includes(q)) && (filter === "sva" || (filter === "dosla" ? arrived.has(b) : !arrived.has(b))),
      ),
    [buses, q, filter, arrived],
  );
  const canAdd = q.length >= 3 && !buses.includes(q);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View style={s.titleRow}>
          <Text style={s.title}>Vozila</Text>
          <Text testID="vozila-count" style={s.count}>{arrived.size}/{buses.length}</Text>
        </View>
        <DateNav />
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Icon name="magnify" size={22} color={colors.muted} />
            <TextInput
              testID="vozila-search-input"
              value={q}
              onChangeText={(t) => setQ(t.replace(/\D/g, "").slice(0, 6))}
              placeholder="Traži / dodaj garažni broj"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={s.searchInput}
            />
          </View>
          <Btn
            testID="vozila-add-button"
            label="DODAJ"
            icon="plus"
            variant="red"
            disabled={!canAdd}
            onPress={async () => {
              await setBuses([...buses, q]);
              showToast(`Dodato vozilo ${q}`);
              setQ("");
            }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow} contentContainerStyle={s.chips}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              testID={`vozila-filter-${f.key}`}
              onPress={() => { tap(); setFilter(f.key); }}
              style={[s.chip, filter === f.key && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}
            >
              <Text style={[s.chipText, filter === f.key && { color: colors.onBrandPrimary }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        keyExtractor={(b) => b}
        numColumns={3}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={[s.list, { paddingBottom: bottomChrome + 24 }]}
        ListEmptyComponent={<Text style={s.empty}>Nema vozila.</Text>}
        ListFooterComponent={
          <Btn
            testID="vozila-reset-button"
            label={confirmReset ? "POTVRDI VRAĆANJE" : "VRATI PODRAZUMEVANU LISTU"}
            variant={confirmReset ? "red" : "outline"}
            icon="restore"
            style={{ marginTop: 16 }}
            onPress={async () => {
              if (!confirmReset) return setConfirmReset(true);
              await setBuses(DEFAULT_BUSES);
              setConfirmReset(false);
              showToast("Lista vraćena");
            }}
          />
        }
        renderItem={({ item }) => {
          const came = arrived.has(item);
          return (
            <View style={[s.cell, came && { borderColor: colors.success, backgroundColor: colors.surfaceSecondary }]} testID={`vozilo-${item}`}>
              <View style={[s.dot, { backgroundColor: came ? colors.success : colors.surfaceTertiary }]} />
              <Text style={s.cellText}>{item}</Text>
              <Pressable
                testID={`vozilo-remove-${item}`}
                hitSlop={8}
                onPress={async () => {
                  await setBuses(buses.filter((b) => b !== item));
                  showToast(`Uklonjeno vozilo ${item}`);
                }}
              >
                <Icon name="close" size={16} color={colors.muted} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, gap: 14, backgroundColor: c.surface },
  titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  title: { fontFamily: fonts.wide, fontSize: 32, color: c.onSurface },
  count: { fontFamily: fonts.bold, fontSize: 20, color: c.brandPrimary },
  searchRow: { flexDirection: "row", gap: 10 },
  searchBox: { flex: 1, height: 52, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 2, borderColor: c.borderStrong, borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: "100%", fontFamily: fonts.semibold, fontSize: 18, color: c.onSurface },
  chipsRow: { height: 56, flexGrow: 0 },
  chips: { gap: 8, alignItems: "center" },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1.5, borderColor: c.border, justifyContent: "center", flexShrink: 0 },
  chipText: { fontFamily: fonts.semibold, fontSize: 16, color: c.onSurface },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  cell: { flex: 1, maxWidth: "32%", height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cellText: { flex: 1, fontFamily: fonts.bold, fontSize: 19, color: c.onSurface },
  empty: { fontFamily: fonts.medium, fontSize: 16, color: c.muted, textAlign: "center", padding: 24 },
}));
