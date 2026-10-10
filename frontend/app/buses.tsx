import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Icon } from "@/src/components/ui";
import { DEFAULT_BUSES } from "@/src/data/buses";
import { useApp } from "@/src/store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Buses() {
  const { buses, setBuses, showToast } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useStyles();
  const { colors } = useTheme();
  const [q, setQ] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const data = useMemo(() => (q ? buses.filter((b) => b.includes(q)) : buses), [buses, q]);
  const canAdd = q.length >= 3 && !buses.includes(q);

  const add = async () => {
    await setBuses([...buses, q]);
    showToast(`Додато: ${q}`);
    setQ("");
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Pressable testID="buses-back-button" onPress={() => router.back()} style={s.back}>
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>ЛИСТА ВОЗИЛА</Text>
          <Text testID="buses-count" style={s.sub}>{buses.length} ГАРАЖНИХ БРОЈЕВА</Text>
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={(b) => b}
        numColumns={3}
        keyboardShouldPersistTaps="handled"
        columnWrapperStyle={{ gap: 8 }}
        contentContainerStyle={s.content}
        ListEmptyComponent={<Text style={s.empty}>Нема резултата.</Text>}
        ListFooterComponent={
          <Btn
            testID="buses-reset-button"
            label={confirmReset ? "ПОТВРДИ ВРАЋАЊЕ" : "ВРАТИ ПОДРАЗУМЕВАНУ ЛИСТУ"}
            variant={confirmReset ? "danger" : "outline"}
            icon="restore"
            style={{ marginTop: 16 }}
            onPress={async () => {
              if (!confirmReset) return setConfirmReset(true);
              await setBuses(DEFAULT_BUSES);
              setConfirmReset(false);
              showToast("Листа враћена");
            }}
          />
        }
        renderItem={({ item }) => (
          <View style={s.cell} testID={`bus-item-${item}`}>
            <Text style={s.cellText}>{item}</Text>
            <Pressable
              testID={`bus-remove-${item}`}
              hitSlop={8}
              onPress={async () => {
                await setBuses(buses.filter((b) => b !== item));
                showToast(`Уклоњено: ${item}`);
              }}
            >
              <Icon name="close" size={18} color={colors.error} />
            </Pressable>
          </View>
        )}
      />
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
          <TextInput
            testID="buses-search-input"
            value={q}
            onChangeText={(t) => setQ(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="Тражи / додај Г.бр."
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            style={s.input}
          />
          <Btn testID="buses-add-button" label="ДОДАЈ" icon="plus" onPress={add} disabled={!canAdd} />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderColor: c.borderStrong,
  },
  back: { width: 48, height: 48, borderWidth: 2, borderColor: c.borderStrong, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.display, fontSize: 24, color: c.onSurface },
  sub: { fontFamily: fonts.bold, fontSize: 12, color: c.muted },
  content: { padding: 16, gap: 8 },
  cell: {
    flex: 1,
    maxWidth: "33%",
    height: 48,
    borderWidth: 2,
    borderColor: c.borderStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  cellText: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: c.muted, textAlign: "center", padding: 24 },
  bar: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 2, borderColor: c.borderStrong, backgroundColor: c.surface },
  input: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: c.borderStrong,
    paddingHorizontal: 12,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: c.onSurface,
    backgroundColor: c.surfaceSecondary,
  },
}));
