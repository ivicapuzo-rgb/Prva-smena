import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Icon, Sheet, tap } from "@/src/components/ui";
import { usesNativeTabs } from "@/src/navigation";
import { displayDate, fmt, num, totalLiters, useApp } from "@/src/store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "del"];

const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function Fuel() {
  const { shift, updateShift, buses, date, showToast } = useApp();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();

  const [bus, setBus] = useState("");
  const [qty, setQty] = useState("");
  const [card, setCard] = useState<"да" | "не">("да");
  const [field, setField] = useState<"bus" | "qty">("bus");
  const [listOpen, setListOpen] = useState(false);
  const [search, setSearch] = useState("");

  const known = bus !== "" && buses.includes(bus);
  const existing = bus ? shift.entries[bus] : undefined;
  const suggestions = useMemo(
    () => (bus && !known ? buses.filter((b) => b.startsWith(bus)).slice(0, 6) : []),
    [bus, known, buses],
  );
  const count = Object.keys(shift.entries).length;

  const press = (k: string) => {
    tap();
    const set = field === "bus" ? setBus : setQty;
    const cur = field === "bus" ? bus : qty;
    if (k === "del") return set(cur.slice(0, -1));
    if (k === ",") {
      if (field === "bus" || cur.includes(",")) return;
      return set((cur || "0") + ",");
    }
    if (field === "bus" && cur.length >= 6) return;
    if (field === "qty" && cur.length >= 8) return;
    set(cur + k);
  };

  const next = () => {
    if (field === "bus") {
      if (!bus) return showToast("Унесите гаражни број", "err");
      if (!known) return showToast(`Г.бр. ${bus} није на листи`, "err");
      if (existing) {
        setQty(existing.qty);
        setCard(existing.card);
      }
      setField("qty");
      return;
    }
    if (!bus || !known) {
      setField("bus");
      return showToast("Неисправан гаражни број", "err");
    }
    if (num(qty) <= 0) return showToast("Унесите количину", "err");
    const entry = { qty: qty.replace(/,$/, ""), card, time: existing?.time ?? nowTime() };
    updateShift((sh) => ({ ...sh, entries: { ...sh.entries, [bus]: entry } }));
    showToast(`${bus} · ${entry.qty} л · картица ${card.toUpperCase()}`);
    setBus("");
    setQty("");
    setCard("да");
    setField("bus");
  };

  const clearAll = () => {
    tap();
    setBus("");
    setQty("");
    setCard("да");
    setField("bus");
  };

  const removeEntry = (b: string) => {
    updateShift((sh) => {
      const e = { ...sh.entries };
      delete e[b];
      return { ...sh, entries: e };
    });
    showToast(`Обрисано: ${b}`);
  };

  const listData = useMemo(() => {
    const entered = buses.filter((b) => shift.entries[b]);
    return search ? entered.filter((b) => b.includes(search)) : entered;
  }, [buses, shift.entries, search]);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>ТОЧЕЊЕ</Text>
          <Text style={s.sub}>ЕВРОДИЗЕЛ · {displayDate(date)}</Text>
        </View>
        <Pressable testID="fuel-open-list" onPress={() => setListOpen(true)} style={s.listBtn}>
          <Text testID="fuel-count" style={s.listBtnTop}>{count} ВОЗ.</Text>
          <Text testID="fuel-total" style={s.listBtnVal}>{fmt(totalLiters(shift))} л</Text>
        </Pressable>
      </View>

      <View style={[s.body, { paddingBottom: bottomChrome + 12 }]}>
        <View style={s.fields}>
          <Pressable
            testID="fuel-field-bus"
            onPress={() => setField("bus")}
            style={[s.field, field === "bus" && s.fieldActive, bus && !known && field === "bus" ? { borderColor: colors.error } : null]}
          >
            <Text style={s.fieldLabel}>Г.БР.</Text>
            <Text testID="fuel-bus-value" style={s.fieldValue} numberOfLines={1}>{bus || "—"}</Text>
            <Text style={[s.hint, known ? { color: colors.success } : null]} numberOfLines={1}>
              {!bus ? "гаражни број" : known ? (existing ? `унето ${existing.qty} л` : "✓ на листи") : "није на листи"}
            </Text>
          </Pressable>
          <Pressable testID="fuel-field-qty" onPress={() => known && setField("qty")} style={[s.field, field === "qty" && s.fieldActive]}>
            <Text style={s.fieldLabel}>ЛИТАРА</Text>
            <Text testID="fuel-qty-value" style={s.fieldValue} numberOfLines={1}>{qty || "—"}</Text>
            <Text style={s.hint}>точена количина</Text>
          </Pressable>
        </View>

        {suggestions.length > 0 && field === "bus" ? (
          <View style={s.suggest}>
            {suggestions.map((b) => (
              <Pressable key={b} testID={`fuel-suggest-${b}`} onPress={() => { tap(); setBus(b); }} style={s.suggestChip}>
                <Text style={s.suggestText}>{b}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>КАРТИЦА</Text>
            {(["да", "не"] as const).map((v) => (
              <Pressable
                key={v}
                testID={`fuel-card-${v === "да" ? "yes" : "no"}`}
                onPress={() => { tap(); setCard(v); }}
                style={[s.cardBtn, card === v && { backgroundColor: v === "да" ? colors.success : colors.error }]}
              >
                <Text style={[s.cardBtnText, card === v && { color: colors.onSuccess }]}>{v.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={s.pad}>
          {[0, 1, 2, 3].map((r) => (
            <View key={r} style={s.padRow}>
              {KEYS.slice(r * 3, r * 3 + 3).map((k) => (
                <Pressable
                  key={k}
                  testID={`numpad-${k === "," ? "comma" : k}`}
                  onPress={() => press(k)}
                  style={({ pressed }) => [s.key, pressed && { backgroundColor: colors.surfaceTertiary }]}
                >
                  {k === "del" ? (
                    <Icon name="backspace-outline" size={28} color={colors.onSurface} />
                  ) : (
                    <Text style={[s.keyText, k === "," && field === "bus" && { color: colors.border }]}>{k}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        <View style={s.actions}>
          <Btn testID="fuel-clear-button" label="ПОНИШТИ" variant="outline" onPress={clearAll} style={{ flex: 1 }} />
          <Btn
            testID="fuel-submit-button"
            label={field === "bus" ? "ДАЉЕ" : "САЧУВАЈ"}
            icon={field === "bus" ? "arrow-right-bold" : "content-save"}
            variant={field === "bus" ? "dark" : "primary"}
            onPress={next}
            style={{ flex: 2 }}
          />
        </View>
      </View>

      <Sheet visible={listOpen} onClose={() => setListOpen(false)} testID="fuel-list-sheet">
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle}>УНЕТО ({count})</Text>
          <Pressable testID="fuel-list-close" onPress={() => setListOpen(false)} style={s.close}>
            <Icon name="close" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
        <TextInput
          testID="fuel-list-search"
          value={search}
          onChangeText={(t) => setSearch(t.replace(/\D/g, ""))}
          placeholder="Тражи Г.бр."
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          style={s.search}
        />
        <FlatList
          data={listData}
          keyExtractor={(b) => b}
          style={{ maxHeight: 420 }}
          ListEmptyComponent={<Text style={s.empty}>Нема унетих возила.</Text>}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          renderItem={({ item }) => {
            const e = shift.entries[item];
            return (
              <View style={s.row} testID={`fuel-entry-${item}`}>
                <Text style={s.rowBus}>{item}</Text>
                <Text style={s.rowQty}>{e.qty} л</Text>
                <Text style={[s.rowCard, { color: e.card === "да" ? colors.success : colors.error }]}>{e.card.toUpperCase()}</Text>
                <Text style={s.rowTime}>{e.time}</Text>
                <Pressable
                  testID={`fuel-entry-edit-${item}`}
                  onPress={() => {
                    setBus(item);
                    setQty(e.qty);
                    setCard(e.card);
                    setField("qty");
                    setListOpen(false);
                  }}
                  style={s.rowBtn}
                >
                  <Icon name="pencil" size={20} color={colors.onSurface} />
                </Pressable>
                <Pressable testID={`fuel-entry-delete-${item}`} onPress={() => removeEntry(item)} style={s.rowBtn}>
                  <Icon name="trash-can-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            );
          }}
        />
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: c.borderStrong,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  sub: { fontFamily: fonts.bold, fontSize: 12, color: c.muted },
  listBtn: { backgroundColor: c.surfaceInverse, paddingHorizontal: 12, paddingVertical: 8, alignItems: "flex-end", minHeight: 48 },
  listBtnTop: { fontFamily: fonts.bold, fontSize: 10, color: c.brand },
  listBtnVal: { fontFamily: fonts.display, fontSize: 18, color: c.onSurfaceInverse },
  body: { flex: 1, padding: 12, gap: 10 },
  fields: { flexDirection: "row", gap: 10 },
  field: { flex: 1, borderWidth: 2, borderColor: c.border, padding: 10, backgroundColor: c.surfaceSecondary },
  fieldActive: { borderColor: c.brandPrimary, borderWidth: 3, backgroundColor: c.surface },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 11, color: c.muted },
  fieldValue: { fontFamily: fonts.display, fontSize: 32, color: c.onSurface },
  hint: { fontFamily: fonts.regular, fontSize: 11, color: c.muted },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 52 },
  cardLabel: { fontFamily: fonts.bold, fontSize: 12, color: c.onSurface, width: 72 },
  cardBtn: { flex: 1, height: 52, borderWidth: 2, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center" },
  cardBtnText: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface },
  suggest: { flexDirection: "row", gap: 6, height: 52, alignItems: "center", flexWrap: "nowrap", overflow: "hidden" },
  suggestChip: { height: 44, paddingHorizontal: 10, borderWidth: 2, borderColor: c.brandPrimary, justifyContent: "center", flexShrink: 0 },
  suggestText: { fontFamily: fonts.bold, fontSize: 15, color: c.onBrandTertiary },
  pad: { flex: 1, gap: 6, minHeight: 200 },
  padRow: { flex: 1, flexDirection: "row", gap: 6 },
  key: { flex: 1, borderWidth: 2, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  keyText: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  actions: { flexDirection: "row", gap: 8 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontFamily: fonts.display, fontSize: 20, color: c.onSurface },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: c.borderStrong },
  search: {
    height: 52,
    borderWidth: 2,
    borderColor: c.borderStrong,
    paddingHorizontal: 12,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: c.onSurface,
    backgroundColor: c.surfaceSecondary,
  },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: c.muted, padding: 16, textAlign: "center" },
  sep: { height: 1, backgroundColor: c.divider },
  row: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 52 },
  rowBus: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface, width: 60 },
  rowQty: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface, flex: 1 },
  rowCard: { fontFamily: fonts.bold, fontSize: 13, width: 32 },
  rowTime: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, width: 48 },
  rowBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
}));
