import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";
import * as XLSX from "xlsx";

import { Day, DAY_NAMES, dayLiters, displayDate, fmt, num, shortDate } from "@/src/app-store";

const TITLE = "LISTA TOČENJA GORIVA - NOVI BEOGRAD";
const sorted = (d: Day) => [...d.arrivals].sort((a, b) => a.time.localeCompare(b.time));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const pumpStats = (d: Day) =>
  Array.from({ length: 8 }, (_, i) => {
    const list = d.arrivals.filter((a) => a.pump === i + 1);
    return { pump: i + 1, count: list.length, liters: list.reduce((s, a) => s + num(a.qty), 0) };
  });

function buildWorkbook(day: Day, buses: string[]) {
  const aoa: (string | number | null)[][] = [];
  const merges: XLSX.Range[] = [];
  const set = (r: number, c: number, v: string | number | null) => {
    while (aoa.length <= r) aoa.push(new Array(16).fill(null));
    aoa[r][c] = v;
  };
  const m = (r1: number, c1: number, r2: number, c2: number) => merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

  set(0, 15, "QF-E-003");
  set(2, 13, "DATUM:");
  set(2, 14, displayDate(day.date));
  set(2, 15, "god.");
  set(3, 5, TITLE);
  m(3, 5, 3, 11);
  set(5, 1, '"SP Novi Beograd"');

  const stats = pumpStats(day);
  stats.forEach((p, i) => {
    const r = 6 + (i % 4) * 2;
    const c0 = i < 4 ? 0 : 9;
    set(r, c0, `Automat  ${p.pump}`);
    m(r, c0, r + 1, c0);
    set(r, c0 + 1, "Broj vozila");
    m(r, c0 + 1, r, c0 + 2);
    set(r, c0 + 3, p.count);
    set(r + 1, c0 + 1, "Točeno (L)");
    m(r + 1, c0 + 1, r + 1, c0 + 2);
    set(r + 1, c0 + 3, Number(p.liters.toFixed(2)));
  });
  set(15, 4, "SMENA");
  m(15, 4, 15, 6);
  set(15, 7, "Od  07h");
  set(15, 8, "Do");
  set(15, 9, "15h");
  set(16, 4, "UKUPNO TOČENO (L)");
  m(16, 4, 16, 6);
  set(16, 7, Number(dayLiters(day).toFixed(2)));
  m(16, 7, 16, 9);

  set(18, 0, "EVRODIZEL");
  m(18, 0, 18, 15);
  const heads = ["G.br.", "Točena količina", "Mesto sipanja", "Vreme točenja"];
  for (let g = 0; g < 4; g++) heads.forEach((h, k) => set(19, g * 4 + k, h));
  const byBus = new Map(day.arrivals.map((a) => [a.bus, a]));
  const rows = Math.ceil(buses.length / 4);
  for (let r = 0; r < rows; r++)
    for (let g = 0; g < 4; g++) {
      const b = buses[g * rows + r];
      if (!b) continue;
      const a = byBus.get(b);
      set(20 + r, g * 4, Number(b));
      set(20 + r, g * 4 + 1, a ? num(a.qty) : null);
      set(20 + r, g * 4 + 2, a ? a.pump : null);
      set(20 + r, g * 4 + 3, a ? a.time : null);
    }
  let r = 20 + rows + 1;
  const notes = sorted(day).filter((a) => a.note.trim());
  if (notes.length) {
    set(r++, 0, "NAPOMENE");
    notes.forEach((a) => {
      set(r, 0, Number(a.bus));
      set(r, 1, `${a.time} — ${a.note}`);
      m(r, 1, r, 10);
      r++;
    });
    r++;
  }
  set(r, 1, "Evidentičar");
  set(r, 12, "Radnik Knez Petrol-a");
  set(r + 1, 1, "____________________");
  set(r + 1, 12, "____________________");

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = Array.from({ length: 16 }, (_, i) => ({ wch: i % 4 === 0 ? 8 : 12 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return wb;
}

async function shareFile(file: File, mime: string, uti: string) {
  await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: uti, dialogTitle: file.name });
}

export async function exportDayExcel(day: Day, buses: string[]) {
  const wb = buildWorkbook(day, buses);
  const name = `Tocenje_${displayDate(day.date)}.xlsx`;
  if (Platform.OS === "web") return void XLSX.writeFile(wb, name);
  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(new Uint8Array(arr));
  await shareFile(f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "org.openxmlformats.spreadsheetml.sheet");
}

async function pdf(html: string, name: string) {
  if (Platform.OS === "web") return void (await Print.printAsync({ html }));
  const { uri } = await Print.printToFileAsync({ html });
  const dest = new File(Paths.cache, name);
  if (dest.exists) dest.delete();
  new File(uri).move(dest);
  await shareFile(dest, "application/pdf", "com.adobe.pdf");
}

const CSS = `<style>@page{size:A4;margin:12mm}body{font-family:Arial,sans-serif;font-size:11px;color:#000}
table{border-collapse:collapse;width:100%;margin-top:8px}td,th{border:1px solid #000;padding:4px}th{background:#eee}
h1{font-size:16px;text-align:center}h2{font-size:13px;margin:14px 0 4px}.r{text-align:right}</style>`;

const arrivalsTable = (d: Day) =>
  `<table><tr><th>#</th><th>Vreme</th><th>G.br.</th><th>Mesto sipanja</th><th>Količina (L)</th><th>Napomena</th></tr>${sorted(d)
    .map((a, i) => `<tr><td>${i + 1}</td><td>${a.time}</td><td><b>${a.bus}</b></td><td>${a.pump}</td><td class="r">${esc(a.qty)}</td><td>${esc(a.note)}</td></tr>`)
    .join("")}</table>`;

export async function exportDayPdf(day: Day) {
  const stats = pumpStats(day);
  const html = `<html><head><meta charset="utf-8"/>${CSS}</head><body>
  <div style="display:flex;justify-content:space-between"><b>GSP BEOGRAD</b><span>QF-E-003 · DATUM: <b>${displayDate(day.date)}</b></span></div>
  <h1>${TITLE}</h1><div>Prva smena 07h – 15h · "SP Novi Beograd"</div>
  <table><tr>${stats.map((p) => `<th>Pumpa ${p.pump}</th>`).join("")}</tr>
  <tr>${stats.map((p) => `<td class="r">${p.count} voz. / ${fmt(p.liters)} L</td>`).join("")}</tr></table>
  <h2>Stigli – redom po vremenu (${day.arrivals.length}) · Ukupno: ${fmt(dayLiters(day))} L</h2>${arrivalsTable(day)}
  <div style="display:flex;justify-content:space-between;margin-top:30px"><div>Evidentičar<br/><br/>____________________</div><div>Radnik Knez Petrol-a<br/><br/>____________________</div></div>
  </body></html>`;
  await pdf(html, `Tocenje_${displayDate(day.date)}.pdf`);
}

const weekLabel = (days: Day[]) => `${shortDate(days[0].date)}-${shortDate(days[6].date)}`;

export async function exportWeekPdf(days: Day[]) {
  const total = days.reduce((s, d) => s + d.arrivals.length, 0);
  const html = `<html><head><meta charset="utf-8"/>${CSS}</head><body>
  <h1>NEDELJNI PREGLED ${weekLabel(days)}</h1><div>Ukupno vozila: <b>${total}</b> · Ukupno točeno: <b>${fmt(days.reduce((s, d) => s + dayLiters(d), 0))} L</b></div>
  <table><tr><th>Dan</th><th>Datum</th><th>Vozila</th><th>Litara</th></tr>${days
    .map((d, i) => `<tr><td>${DAY_NAMES[i]}</td><td>${displayDate(d.date)}</td><td class="r">${d.arrivals.length}</td><td class="r">${fmt(dayLiters(d))}</td></tr>`)
    .join("")}</table>
  ${days.filter((d) => d.arrivals.length).map((d, i) => `<h2>${displayDate(d.date)}</h2>${arrivalsTable(d)}`).join("")}
  </body></html>`;
  await pdf(html, `Nedelja_${weekLabel(days).replace(/\./g, "_")}.pdf`);
}

export async function shareWeekText(days: Day[]) {
  const total = days.reduce((s, d) => s + d.arrivals.length, 0);
  const lines = days.map((d, i) => `${DAY_NAMES[i]} ${shortDate(d.date)}: ${d.arrivals.length} voz. / ${fmt(dayLiters(d))} L`);
  await Share.share({ message: `Nedeljni pregled ${weekLabel(days)}\nUkupno vozila: ${total}\n\n${lines.join("\n")}` });
}
