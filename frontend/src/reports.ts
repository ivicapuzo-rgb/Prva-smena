import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";

import { Day, DAY_NAMES, dayLiters, displayDate, fmt, num, shortDate } from "@/src/app-store";
import { fillTemplate } from "@/src/xlsx-template";

const TITLE = "LISTA TOČENJA GORIVA - NOVI BEOGRAD";
const sorted = (d: Day) => [...d.arrivals].sort((a, b) => a.time.localeCompare(b.time));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const pumpStats = (d: Day) =>
  Array.from({ length: 8 }, (_, i) => {
    const list = d.arrivals.filter((a) => a.pump === i + 1);
    return { pump: i + 1, count: list.length, liters: list.reduce((s, a) => s + num(a.qty), 0) };
  });

async function shareFile(file: File, mime: string, uti: string) {
  await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: uti, dialogTitle: file.name });
}

export async function exportDayExcel(day: Day) {
  const bytes = await fillTemplate(day);
  const name = `Tocenje_${displayDate(day.date)}.xlsx`;
  const mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = (globalThis as any).document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(bytes);
  await shareFile(f, mime, "org.openxmlformats.spreadsheetml.sheet");
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
  `<table><tr><th>G.br.</th><th>Vreme</th><th>Mesto sipanja</th><th>Količina (L)</th><th>Napomena</th></tr>${sorted(d)
    .map((a) => `<tr><td><b>${a.bus}</b></td><td>${a.time}</td><td>${a.pump}</td><td class="r">${esc(a.qty)}</td><td>${esc(a.note)}</td></tr>`)
    .join("")}</table>`;

const PDF_CSS = `<style>
@page{size:A4 portrait;margin:9mm}
body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:9px;margin:0}
.code{text-align:right;font-weight:bold;font-size:11px}
.date{text-align:right;font-size:11px;margin-top:6px}
h1{text-align:center;font-size:15px;margin:6px 0 10px}
.sp{font-size:11px;margin-bottom:6px}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #bbb;padding:0 4px;height:15px}
th{background:#E10600;color:#fff;font-weight:bold;text-align:left;font-size:9.5px;border-color:#E10600}
.pumps td{font-size:9.5px;height:15px}
.pumps .an{font-weight:bold;width:15%}
.pumps .gap{border:none;width:6px}
.meta{margin:14px 0 0 22%;font-size:11px;font-weight:bold;line-height:22px}
.title{background:#E10600;color:#fff;text-align:center;font-weight:bold;font-size:10px;border-color:#E10600}
.sub th{background:#fff;color:#111;text-align:center;font-size:7.5px;line-height:8px;border-color:#bbb;padding:2px}
.bus td{height:13px;font-size:8px}
.g{width:7%}.q{width:7%;text-align:right}.c{width:6%;text-align:center;color:#aaa;font-size:7px}.t{width:5%;text-align:center}
.f{background:#FFF6D6}.f.q,.f.t{font-weight:bold}.f.g{font-weight:bold}
.page{page-break-before:always;padding-top:4px}
.sig{display:flex;justify-content:space-between;margin-top:26px;font-size:11px}
</style>`;

const PAGE1_ROWS = 38;
const PAGE_ROWS = 62;

function busPages(buses: string[]) {
  const list = [...buses].sort((a, b) => Number(a) - Number(b));
  const pages: string[][] = [];
  let i = 0;
  let size = PAGE1_ROWS * 4;
  while (i < list.length) {
    pages.push(list.slice(i, i + size));
    i += size;
    size = PAGE_ROWS * 4;
  }
  return pages;
}

function busTable(page: string[], day: Day) {
  const byBus = new Map(day.arrivals.map((a) => [a.bus, a]));
  const rows = Math.ceil(page.length / 4);
  const head = Array(4).fill('<th>G.br.</th><th>Točena količina</th><th>Ispravnost kartice</th><th>Vreme točenja</th>').join("");
  let body = "";
  for (let r = 0; r < rows; r++) {
    body += "<tr>";
    for (let g = 0; g < 4; g++) {
      const b = page[g * rows + r];
      const a = b ? byBus.get(b) : undefined;
      const f = a ? " f" : "";
      body += b
        ? `<td class="g${f}">${b}</td><td class="q${f}">${a ? esc(a.qty) : ""}</td><td class="c${f}">da / ne</td><td class="t${f}">${a ? a.time : ""}</td>`
        : '<td class="g"></td><td class="q"></td><td class="c"></td><td class="t"></td>';
    }
    body += "</tr>";
  }
  return `<table class="bus"><tr><th colspan="16" class="title">EVRODIZEL</th></tr><tr class="sub">${head}</tr>${body}</table>`;
}

export function dayPdfHtml(day: Day, buses: string[]) {
  let pumps = "";
  for (let i = 0; i < 4; i++) {
    const side = (n: number) => [
      `<td rowspan="2" class="an">Automat ${n}</td><td>Početno stanje</td><td></td><td rowspan="2"></td>`,
      `<td>Završno stanje</td><td></td>`,
    ];
    const [l1, l2] = side(i + 1);
    const [r1, r2] = side(i + 5);
    pumps += `<tr>${l1}<td class="gap" rowspan="2"></td>${r1}</tr><tr>${l2}${r2}</tr>`;
  }
  const pages = busPages(buses);
  const notes = sorted(day).filter((a) => a.note.trim());
  return `<html><head><meta charset="utf-8"/>${PDF_CSS}</head><body>
  <div class="code">QF-E-003</div>
  <div class="date">DATUM: ${displayDate(day.date)}. god.</div>
  <h1>${TITLE}</h1>
  <div class="sp">"SP Novi Beograd"</div>
  <table class="pumps"><tr><th>Automat</th><th>Stanje</th><th>Vrednost</th><th>Razlika</th><th class="gap" style="background:#fff;border:none"></th><th>Automat</th><th>Stanje</th><th>Vrednost</th><th>Razlika</th></tr>${pumps}</table>
  <div class="meta">SMENA&nbsp;&nbsp; Od 07h&nbsp;&nbsp; Do 15h<br/>UKUPNA RAZLIKA:&nbsp; 0</div>
  <div style="margin-top:12px">${busTable(pages[0] ?? [], day)}</div>
  ${pages.slice(1).map((p) => `<div class="page">${busTable(p, day)}</div>`).join("")}
  ${notes.length ? `<div style="margin-top:14px;font-size:10px"><b>NAPOMENE</b><br/>${notes.map((a) => `${a.bus} · ${a.time} — ${esc(a.note)}`).join("<br/>")}</div>` : ""}
  <div class="sig"><div>Evidentičar<br/><br/>______________________</div><div>Radnik Knez Petrol-a<br/><br/>______________________</div></div>
  </body></html>`;
}

export async function exportDayPdf(day: Day, buses: string[]) {
  await pdf(dayPdfHtml(day, buses), `Tocenje_${displayDate(day.date)}.pdf`);
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
