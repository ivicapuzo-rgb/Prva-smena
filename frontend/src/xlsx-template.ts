import JSZip from "jszip";

import type { Day } from "@/src/app-store";
import { TEMPLATE_XLSX_B64 } from "@/src/data/template-xlsx";

const SHEET = "xl/worksheets/sheet1.xml";
const NEXT: Record<string, [string, string]> = { A: ["B", "D"], E: ["F", "H"], I: ["J", "L"], M: ["N", "P"] };

const excelSerial = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86400000);
};

/** Replace an (empty or filled) cell keeping its style. */
function setCell(xml: string, ref: string, inner: string, type?: string) {
  const re = new RegExp(`<c r="${ref}"( s="\\d+")?( t="\\w+")?(/>|>.*?</c>)`);
  return xml.replace(re, (_m, s = "") => `<c r="${ref}"${s}${type ? ` t="${type}"` : ""}>${inner}</c>`);
}

/**
 * Fills the ORIGINAL form (logo, styles, merges, formulas untouched): only the date,
 * and for every garage number that arrived its quantity and time cells.
 */
export async function fillTemplate(day: Day): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(TEMPLATE_XLSX_B64, { base64: true });
  let xml = await zip.file(SHEET)!.async("string");

  const byBus = new Map(day.arrivals.map((a) => [a.bus, a]));
  const done = new Set<string>();
  const cellRe = /<c r="([AEIM])(\d+)"(?: s="\d+")?><v>(\d+)<\/v><\/c>/g;
  const hits: { col: string; row: string; bus: string }[] = [];
  for (const m of xml.matchAll(cellRe)) {
    if (Number(m[2]) >= 21 && byBus.has(m[3]) && !done.has(m[3])) {
      done.add(m[3]);
      hits.push({ col: m[1], row: m[2], bus: m[3] });
    }
  }
  for (const h of hits) {
    const a = byBus.get(h.bus)!;
    const [qCol, tCol] = NEXT[h.col];
    const qty = String(a.qty).replace(",", ".");
    xml = setCell(xml, `${qCol}${h.row}`, `<v>${Number(qty)}</v>`);
    xml = setCell(xml, `${tCol}${h.row}`, `<is><t>${a.time}</t></is>`, "inlineStr");
  }
  // Date: replace TODAY() with the shift date (calc chain is rebuilt by Excel).
  xml = setCell(xml, "O3", `<v>${excelSerial(day.date)}</v>`);
  zip.file(SHEET, xml);

  zip.remove("xl/calcChain.xml");
  const ct = await zip.file("[Content_Types].xml")!.async("string");
  zip.file("[Content_Types].xml", ct.replace(/<Override PartName="\/xl\/calcChain.xml"[^>]*\/>/, ""));
  const rels = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  zip.file("xl/_rels/workbook.xml.rels", rels.replace(/<Relationship [^>]*Target="calcChain.xml"\/>/, ""));

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
