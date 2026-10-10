import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Btn, Icon, Sheet } from "@/src/components/ui";
import { exportExcel, exportPdf } from "@/src/export";
import { usesNativeTabs } from "@/src/navigation";
import { displayDate, fmt, loadShift, Shift, totalDiff, totalLiters, useApp } from "@/src/store";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function History() {
  const { savedDates, shift: active, setDate, deleteShift, buses, showToast } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Shift | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState<"x" | "p" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setShifts(await Promise.all(savedDates.map(loadShift)));
    setLoading(false);
  }, [savedDates]);

  useEffect(() => {
    load();
  }, [load, active]);

  const doExport = async (kind: "x" | "p") => {
    if (!sel) return;
    setBusy(kind);
    try {
      if (kind === "x") await exportExcel(sel, buses);
      else await exportPdf(sel, buses);
    } catch {
      showToast("Грешка при извозу", "err");
    }
    setBusy(null);
  };

  const close = () => {
    setSel(null);
    setConfirmDel(false);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.title}>ИСТОРИЈА</Text>
        <Text style={s.sub}>{savedDates.length} САЧУВАНИХ СМЕНА</Text>
      </View>
      <FlatList
        data={shifts}
        keyExtractor={(x) => x.date}
        contentContainerStyle={[s.content, { paddingBottom: bottomChrome + 24 }, shifts.length === 0 && { flex: 1 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.brandPrimary} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={s.empty} testID="history-empty">
              <Icon name="clipboard-text-outline" size={64} color={colors.muted} />
              <Text style={s.emptyTitle}>Нема сачуваних смена</Text>
              <Text style={s.emptySub}>Унесите стање аутомата или точење да бисте сачували смену.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`history-item-${item.date}`}
            onPress={() => setSel(item)}
            style={({ pressed }) => [s.item, pressed && { backgroundColor: colors.surfaceSecondary }]}
          >
            <View style={s.itemDate}>
              <Text style={s.itemDay}>{item.date.slice(8, 10)}</Text>
              <Text style={s.itemMonth}>{item.date.slice(5, 7)}.{item.date.slice(0, 4)}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.itemLine}>РАЗЛИКА {fmt(totalDiff(item))}</Text>
              <Text style={s.itemSub}>
                ТОЧЕНО {fmt(totalLiters(item))} л · {Object.keys(item.entries).length} воз.
              </Text>
            </View>
            <Icon name="chevron-right" size={28} color={colors.onSurface} />
          </Pressable>
        )}
      />

      <Sheet visible={!!sel} onClose={close} testID="history-sheet">
        {sel && (
          <>
            <Text style={s.sheetTitle}>{displayDate(sel.date)}</Text>
            <View style={s.sumRow}>
              <View style={s.sumCell}>
                <Text style={s.sumLabel}>УК. РАЗЛИКА</Text>
                <Text style={s.sumVal}>{fmt(totalDiff(sel))}</Text>
              </View>
              <View style={s.sumCell}>
                <Text style={s.sumLabel}>ТОЧЕНО</Text>
                <Text style={s.sumVal}>{fmt(totalLiters(sel))}</Text>
              </View>
              <View style={s.sumCell}>
                <Text style={s.sumLabel}>ВОЗИЛА</Text>
                <Text style={s.sumVal}>{Object.keys(sel.entries).length}</Text>
              </View>
            </View>
            <Btn testID="history-export-excel" label="ЕКСПОРТ EXCEL" icon="file-excel" variant="dark" loading={busy === "x"} onPress={() => doExport("x")} />
            <Btn testID="history-export-pdf" label="ЕКСПОРТ PDF" icon="file-pdf-box" variant="dark" loading={busy === "p"} onPress={() => doExport("p")} />
            <Btn
              testID="history-open-button"
              label="ОТВОРИ / ИЗМЕНИ"
              icon="pencil"
              onPress={() => {
                setDate(sel.date);
                close();
                router.navigate("/");
              }}
            />
            <Btn
              testID="history-delete-button"
              label={confirmDel ? "ПОТВРДИ БРИСАЊЕ" : "ОБРИШИ СМЕНУ"}
              icon="trash-can-outline"
              variant={confirmDel ? "danger" : "outline"}
              onPress={async () => {
                if (!confirmDel) return setConfirmDel(true);
                await deleteShift(sel.date);
                showToast("Смена обрисана");
                close();
              }}
            />
          </>
        )}
      </Sheet>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 2, borderColor: c.borderStrong },
  title: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  sub: { fontFamily: fonts.bold, fontSize: 12, color: c.muted },
  content: { padding: 16, gap: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface },
  emptySub: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, textAlign: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 2, borderColor: c.borderStrong, paddingRight: 8 },
  itemDate: { backgroundColor: c.surfaceInverse, width: 80, paddingVertical: 10, alignItems: "center" },
  itemDay: { fontFamily: fonts.display, fontSize: 26, color: c.onSurfaceInverse },
  itemMonth: { fontFamily: fonts.bold, fontSize: 11, color: c.brand },
  itemLine: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  itemSub: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  sheetTitle: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  sumRow: { flexDirection: "row", borderWidth: 2, borderColor: c.borderStrong },
  sumCell: { flex: 1, padding: 10, gap: 2 },
  sumLabel: { fontFamily: fonts.bold, fontSize: 10, color: c.muted },
  sumVal: { fontFamily: fonts.display, fontSize: 18, color: c.onSurface },
}));
