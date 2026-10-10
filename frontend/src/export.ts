import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";

import { displayDate, fmt, num, pumpDiff, Shift, totalDiff, totalLiters } from "@/src/store";

const TITLE = "ЛИСТА ТОЧЕЊА ГОРИВА - НОВИ БЕОГРАД";

// Bus rows laid out column-major in 4 groups like the paper form.
function busGrid(buses: string[]) {
  const rows = Math.ceil(buses.length / 4);
  return { rows, at: (r: number, g: number) => buses[g * rows + r] };
}

export function buildWorkbook(shift: Shift, buses: string[]) {
  const aoa: (string | number | null)[][] = [];
  const merges: XLSX.Range[] = [];
  const set = (r: number, c: number, v: string | number | null) => {
    while (aoa.length <= r) aoa.push(new Array(16).fill(null));
    aoa[r][c] = v;
  };
  const m = (r1: number, c1: number, r2: number, c2: number) =>
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

  set(0, 15, "QF-E-003");
  set(2, 13, "ДАТУМ:");
  set(2, 14, displayDate(shift.date));
  set(2, 15, "год.");
  set(3, 5, TITLE);
  m(3, 5, 3, 11);
  set(5, 1, '"СП Нови Београд"');

  shift.pumps.forEach((p, i) => {
    const left = i < 4;
    const r = 6 + (i % 4) * 2;
    const c0 = left ? 0 : 9;
    const val = (s: string) => (s.trim() === "" ? null : num(s));
    set(r, c0, `Аутомат  ${i + 1}`);
    m(r, c0, r + 1, c0);
    set(r, c0 + 1, "Почетно стање");
    m(r, c0 + 1, r, c0 + 2);
    set(r + 1, c0 + 1, "Завршно стање");
    m(r + 1, c0 + 1, r + 1, c0 + 2);
    set(r, c0 + 3, val(p.start));
    m(r, c0 + 3, r, c0 + 4);
    set(r + 1, c0 + 3, val(p.end));
    m(r + 1, c0 + 3, r + 1, c0 + 4);
    set(r, left ? 6 : 15, "Разлика");
    set(r + 1, left ? 6 : 15, Number(fmt(pumpDiff(p))));
  });

  set(15, 4, "СМЕНА");
  m(15, 4, 15, 6);
  set(15, 7, "Од  07h");
  set(15, 8, "До");
  set(15, 9, "15h");
  set(16, 4, "УКУПНА РАЗЛИКА");
  m(16, 4, 16, 6);
  set(16, 7, Number(fmt(totalDiff(shift))));
  m(16, 7, 16, 9);

  set(18, 0, "ЕВРОДИЗЕЛ");
  m(18, 0, 18, 15);
  const heads = ["Г.бр.", "Точена количина", "Исправност Картице", "Време точења"];
  for (let g = 0; g < 4; g++) heads.forEach((h, k) => set(19, g * 4 + k, h));
  const { rows, at } = busGrid(buses);
  for (let r = 0; r < rows; r++) {
    for (let g = 0; g < 4; g++) {
      const b = at(r, g);
      if (!b) continue;
      const e = shift.entries[b];
      const c = g * 4;
      set(20 + r, c, isNaN(Number(b)) ? b : Number(b));
      set(20 + r, c + 1, e ? num(e.qty) : null);
      set(20 + r, c + 2, e ? e.card : "да / не");
      set(20 + r, c + 3, e ? e.time : null);
    }
  }
  const after = 20 + rows + 1;
  set(after, 0, "УКУПНО ТОЧЕНО (л):");
  m(after, 0, after, 2);
  set(after, 3, Number(fmt(totalLiters(shift))));
  set(after, 5, "Број возила:");
  set(after, 7, Object.keys(shift.entries).length);
  set(after + 3, 1, "Евидентичар");
  m(after + 3, 1, after + 3, 2);
  set(after + 4, 1, shift.evidenticar || "____________________");
  m(after + 4, 1, after + 4, 4);
  set(after + 3, 12, "Радник Кнез Петрол-а");
  m(after + 3, 12, after + 3, 14);
  set(after + 4, 12, shift.radnik || "____________________");
  m(after + 4, 12, after + 4, 15);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = merges;
  ws["!cols"] = Array.from({ length: 16 }, (_, i) => ({ wch: i % 4 === 0 ? 8 : 11 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return wb;
}

async function shareFile(name: string, bytes: Uint8Array, mime: string, uti: string) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(bytes);
  await Sharing.shareAsync(f.uri, { mimeType: mime, UTI: uti, dialogTitle: name });
}

export async function exportExcel(shift: Shift, buses: string[]) {
  const wb = buildWorkbook(shift, buses);
  const name = `Tocenje_${displayDate(shift.date)}.xlsx`;
  if (Platform.OS === "web") {
    XLSX.writeFile(wb, name);
    return;
  }
  const arr = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  await shareFile(
    name,
    new Uint8Array(arr),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "org.openxmlformats.spreadsheetml.sheet",
  );
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function buildHtml(shift: Shift, buses: string[]) {
  const pumpCell = (i: number) => {
    const p = shift.pumps[i];
    return `<td rowspan="2" class="b">Аутомат ${i + 1}</td><td>Почетно стање</td><td class="n">${esc(p.start)}</td><td class="b">Разлика</td>`;
  };
  const pumpCell2 = (i: number) => {
    const p = shift.pumps[i];
    return `<td>Завршно стање</td><td class="n">${esc(p.end)}</td><td class="n b">${fmt(pumpDiff(p))}</td>`;
  };
  let pumps = "";
  for (let i = 0; i < 4; i++) {
    pumps += `<tr>${pumpCell(i)}<td class="gap"></td>${pumpCell(i + 4)}</tr>`;
    pumps += `<tr>${pumpCell2(i)}<td class="gap"></td>${pumpCell2(i + 4)}</tr>`;
  }
  const { rows, at } = busGrid(buses);
  let body = "";
  for (let r = 0; r < rows; r++) {
    body += "<tr>";
    for (let g = 0; g < 4; g++) {
      const b = at(r, g);
      const e = b ? shift.entries[b] : undefined;
      body += b
        ? `<td class="b">${esc(b)}</td><td class="n">${e ? esc(e.qty) : ""}</td><td>${e ? e.card : "да / не"}</td><td>${e ? e.time : ""}</td>`
        : "<td></td><td></td><td></td><td></td>";
    }
    body += "</tr>";
  }
  const h = "<th>Г.бр.</th><th>Точена количина</th><th>Исправност Картице</th><th>Време точења</th>";
  return `<html><head><meta charset="utf-8"/><style>
  @page { size: A4; margin: 10mm; }
  body { font-family: Arial, sans-serif; font-size: 9px; color: #000; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 2px 3px; }
  th { font-size: 8px; background: #eee; }
  .n { text-align: right; } .b { font-weight: bold; }
  .gap { border: none; width: 16px; }
  .top { display: flex; justify-content: space-between; align-items: flex-end; }
  h1 { font-size: 14px; text-align: center; margin: 4px 0 8px; }
  .sig { display: flex; justify-content: space-between; margin-top: 24px; font-size: 11px; }
  </style></head><body>
  <div class="top"><b>ГСП БЕОГРАД</b><div>QF-E-003<br/>ДАТУМ: <b>${displayDate(shift.date)}</b> год.</div></div>
  <h1>${TITLE}</h1>
  <div style="margin-bottom:4px">"СП Нови Београд"</div>
  <table>${pumps}</table>
  <table style="width:50%;margin:8px auto">
    <tr><td class="b">СМЕНА</td><td>Од 07h</td><td>До 15h</td></tr>
    <tr><td class="b">УКУПНА РАЗЛИКА</td><td colspan="2" class="n b">${fmt(totalDiff(shift))}</td></tr>
    <tr><td class="b">УКУПНО ТОЧЕНО</td><td colspan="2" class="n b">${fmt(totalLiters(shift))} л (${Object.keys(shift.entries).length} возила)</td></tr>
  </table>
  <table><tr><th colspan="16">ЕВРОДИЗЕЛ</th></tr><tr>${h}${h}${h}${h}</tr>${body}</table>
  <div class="sig"><div>Евидентичар<br/><br/>${esc(shift.evidenticar) || "______________________"}</div>
  <div>Радник Кнез Петрол-а<br/><br/>${esc(shift.radnik) || "______________________"}</div></div>
  </body></html>`;
}

export async function exportPdf(shift: Shift, buses: string[]) {
  const html = buildHtml(shift, buses);
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const name = `Tocenje_${displayDate(shift.date)}.pdf`;
  const src = new File(uri);
  const dest = new File(Paths.cache, name);
  if (dest.exists) dest.delete();
  src.move(dest);
  await Sharing.shareAsync(dest.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: name });
}
