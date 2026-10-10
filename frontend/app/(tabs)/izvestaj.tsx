import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Day, DAY_NAMES, dayLiters, displayDate, fmt, loadDay, shortDate, useApp, weekDates } from "@/src/app-store";
import { Btn, Card, CardTitle, DateNav } from "@/src/components/kit";
import { usesNativeTabs } from "@/src/navigation";
import { exportDayExcel, exportDayPdf, exportWeekPdf, pumpStats, shareWeekText } from "@/src/reports";
import { fonts, makeStyles, useTheme } from "@/src/theme";

export default function Izvestaj() {
  const { day, date, buses, version, showToast } = useApp();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const s = useStyles();
  const { colors } = useTheme();
  const [week, setWeek] = useState<Day[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    Promise.all(weekDates(date).map(loadDay)).then(setWeek);
  }, [date, version]);

  const arrivals = useMemo(() => [...day.arrivals].sort((a, b) => a.time.localeCompare(b.time)), [day]);
  const stats = pumpStats(day);
  const maxCount = Math.max(4, ...stats.map((p) => p.count));
  const top = stats.reduce((a, b) => (b.count > a.count ? b : a), stats[0]);
  const weekTotal = week.reduce((a, d) => a + d.arrivals.length, 0);
  const busiest = week
    .map((d, i) => ({ d, i }))
    .filter((x) => x.d.arrivals.length > 0)
    .sort((a, b) => b.d.arrivals.length - a.d.arrivals.length)
    .slice(0, 3);
  const weekMax = Math.max(1, ...week.map((d) => d.arrivals.length));

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch {
      showToast("Greška pri izvozu", "err");
    }
    setBusy(null);
  };

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 16, paddingBottom: bottomChrome + 24 }]}>
        <Text style={s.title}>Izveštaj</Text>
        <DateNav />

        <Card testID="report-arrivals">
          <Text style={s.cardHead}>
            Stigli - redom po vremenu <Text testID="report-arrivals-count">({arrivals.length})</Text>
          </Text>
          {arrivals.length === 0 ? (
            <Text style={s.emptyText}>Nema vozila za {displayDate(date)}.</Text>
          ) : (
            arrivals.map((a, i) => (
              <View key={a.id} style={s.arrRow} testID={`report-arrival-${a.bus}`}>
                <Text style={s.arrIdx}>{i + 1}.</Text>
                <Text style={s.arrTime}>{a.time}</Text>
                <Text style={s.arrBus}>{a.bus}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.arrInfo}>Pumpa {a.pump} · {a.qty} L</Text>
                  {!!a.note && <Text style={s.arrNote} numberOfLines={2}>{a.note}</Text>}
                </View>
              </View>
            ))
          )}
          {arrivals.length > 0 && (
            <Text style={s.total}>Ukupno točeno: <Text style={s.bold} testID="report-total-liters">{fmt(dayLiters(day))} L</Text></Text>
          )}
        </Card>

        <Card testID="report-pumps">
          <CardTitle icon="signal-cellular-3">Statistika mesta sipanja</CardTitle>
          <View style={s.tiles}>
            {stats.map((p) => (
              <View key={p.pump} style={s.tile} testID={`pump-stat-${p.pump}`}>
                <Text style={s.tileLabel}>PUMPA {p.pump}</Text>
                <Text style={s.tileValue}>{p.count}</Text>
              </View>
            ))}
          </View>
          <View style={s.chart}>
            <View style={s.axis}>
              {[4, 3, 2, 1, 0].map((n) => (
                <Text key={n} style={s.axisText}>{Math.round((maxCount * n) / 4)}</Text>
              ))}
            </View>
            <View style={s.bars}>
              {stats.map((p) => (
                <View key={p.pump} style={s.barCol}>
                  <View style={s.barTrack}>
                    <View style={[s.bar, { height: `${(p.count / maxCount) * 100}%`, backgroundColor: p === top && p.count ? colors.brandPrimary : colors.accent }]} />
                  </View>
                  <Text style={s.axisText}>{p.pump}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={s.bold} testID="report-top-pump">Najkorišćenija pumpa: {top.count ? `Pumpa ${top.pump} (${top.count})` : "-"}</Text>
        </Card>

        <Card testID="report-week">
          <CardTitle icon="poll">Nedeljni pregled</CardTitle>
          {week.length === 7 && <Text style={s.weekRange}>{shortDate(week[0].date)}-{shortDate(week[6].date)}</Text>}
          <Text style={s.muted}>Ukupno vozila: <Text style={s.bold} testID="report-week-total">{weekTotal}</Text></Text>
          <Text style={s.subHead}>Najprometniji dani</Text>
          {busiest.length === 0 ? (
            <Text style={s.emptyText}>Nema podataka za ovu nedelju</Text>
          ) : (
            busiest.map(({ d, i }) => (
              <View key={d.date} style={s.dayRow}>
                <Text style={s.dayName}>{DAY_NAMES[i]} {shortDate(d.date)}</Text>
                <View style={s.dayTrack}>
                  <View style={[s.dayBar, { width: `${(d.arrivals.length / weekMax) * 100}%` }]} />
                </View>
                <Text style={s.dayCount}>{d.arrivals.length}</Text>
              </View>
            ))
          )}
          <View style={s.btnRow}>
            <Btn testID="week-pdf-button" label="Nedeljni PDF" icon="file-download-outline" variant="blue" style={{ flex: 1 }} loading={busy === "wp"} onPress={() => run("wp", () => exportWeekPdf(week))} />
            <Btn testID="week-share-button" label="Podeli" icon="share-variant-outline" variant="blue" style={{ flex: 1 }} loading={busy === "ws"} onPress={() => run("ws", () => shareWeekText(week))} />
          </View>
        </Card>

        <Card testID="report-day">
          <CardTitle icon="file-document-outline">Dnevna lista točenja</CardTitle>
          <Text style={s.muted}>Obrazac QF-E-003 za {displayDate(date)} · {arrivals.length} vozila · {fmt(dayLiters(day))} L</Text>
          <View style={s.btnRow}>
            <Btn testID="day-excel-button" label="Excel" icon="file-excel-outline" variant="red" style={{ flex: 1 }} loading={busy === "dx"} onPress={() => run("dx", () => exportDayExcel(day, buses))} />
            <Btn testID="day-pdf-button" label="PDF" icon="file-pdf-box" variant="red" style={{ flex: 1 }} loading={busy === "dp"} onPress={() => run("dp", () => exportDayPdf(day))} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  content: { paddingHorizontal: 16, gap: 24 },
  title: { fontFamily: fonts.wide, fontSize: 34, color: c.onSurface, marginBottom: -8 },
  cardHead: { fontFamily: fonts.semibold, fontSize: 23, color: c.onSurface },
  emptyText: { fontFamily: fonts.medium, fontSize: 16, color: c.muted },
  arrRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.divider },
  arrIdx: { fontFamily: fonts.medium, fontSize: 16, color: c.muted, width: 24 },
  arrTime: { fontFamily: fonts.wide, fontSize: 13, color: c.onSurface, width: 56, marginTop: 3 },
  arrBus: { fontFamily: fonts.bold, fontSize: 20, color: c.onSurface, width: 50 },
  arrInfo: { fontFamily: fonts.semibold, fontSize: 16, color: c.onSurfaceTertiary },
  arrNote: { fontFamily: fonts.medium, fontSize: 14, color: c.brandPrimary },
  total: { fontFamily: fonts.medium, fontSize: 16, color: c.onSurfaceTertiary },
  bold: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "22%", flexGrow: 1, height: 66, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.onSurfaceTertiary },
  tileValue: { fontFamily: fonts.display, fontSize: 26, color: c.onSurface },
  chart: { flexDirection: "row", height: 120, gap: 8 },
  axis: { justifyContent: "space-between", paddingBottom: 18, width: 22, alignItems: "flex-end" },
  axisText: { fontFamily: fonts.medium, fontSize: 11, color: c.muted },
  bars: { flex: 1, flexDirection: "row", gap: 8 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "70%", justifyContent: "flex-end" },
  bar: { width: "100%", borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  weekRange: { fontFamily: fonts.medium, fontSize: 28, color: c.onSurface },
  muted: { fontFamily: fonts.medium, fontSize: 16, color: c.onSurfaceTertiary },
  subHead: { fontFamily: fonts.medium, fontSize: 24, color: c.onSurface, marginTop: 8 },
  dayRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dayName: { fontFamily: fonts.semibold, fontSize: 16, color: c.onSurface, width: 130 },
  dayTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  dayBar: { height: "100%", backgroundColor: c.brandPrimary },
  dayCount: { fontFamily: fonts.bold, fontSize: 18, color: c.onSurface, width: 28, textAlign: "right" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
}));
