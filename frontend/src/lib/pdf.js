import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate, fmtShort, fmtL, fmtTot, dayName, range, addDays } from "./dates";
import { SEED_VEHICLES } from "@/data/vehicles";
import { pumpStats, sortDesc, inRange, dayCounts, sumL, topDays, byDate } from "./stats";

let fontCache = null;
const toB64 = (buf) => {
  let s = "";
  const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
};
async function fonts() {
  if (!fontCache) {
    const [r, b] = await Promise.all(
      ["Roboto-Regular", "Roboto-Bold"].map((n) => fetch(`/fonts/${n}.ttf`).then((x) => x.arrayBuffer())),
    );
    fontCache = { r: toB64(r), b: toB64(b) };
  }
  return fontCache;
}
async function newDoc() {
  const f = await fonts();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("Roboto-Regular.ttf", f.r);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", f.b);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");
  return doc;
}

const RED = [225, 6, 0];
const base = {
  styles: { font: "Roboto", fontSize: 9, cellPadding: 1.6, lineColor: [190, 190, 190], lineWidth: 0.2, textColor: 20 },
  headStyles: { fillColor: RED, textColor: 255, fontStyle: "bold" },
  margin: { left: 12, right: 12 },
};
const bold = (doc, size) => { doc.setFont("Roboto", "bold"); doc.setFontSize(size); };
const normal = (doc, size) => { doc.setFont("Roboto", "normal"); doc.setFontSize(size); };

function header(doc, title, sub) {
  bold(doc, 18); doc.setTextColor(...RED); doc.text(title, 12, 18);
  normal(doc, 10); doc.setTextColor(70); doc.text(sub, 12, 25);
  doc.setDrawColor(...RED); doc.setLineWidth(0.6); doc.line(12, 28, 198, 28);
  doc.setTextColor(0);
}
function footer(doc) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i += 1) {
    doc.setPage(i); normal(doc, 7); doc.setTextColor(130);
    doc.text("Prva smena · SP Novi Beograd · EVIDENTIČAR Puzović Ivica", 12, 290);
    doc.text(`Strana ${i}/${n}`, 198, 290, { align: "right" });
  }
  doc.setTextColor(0);
}
const ensure = (doc, y, need) => (y + need > 280 ? (doc.addPage(), 18) : y);

function pumpTable(doc, list, y) {
  const { pumps, top } = pumpStats(list);
  bold(doc, 12); doc.text("Statistika mesta sipanja", 12, y);
  autoTable(doc, {
    ...base, startY: y + 3,
    head: [["Mesto sipanja", "Broj vozila", "Litara"]],
    body: pumps.map((p) => [`Pumpa ${p.pump}`, p.count, fmtL(p.liters)]),
    didParseCell: (d) => {
      if (d.section === "body" && top.some((t) => t.pump === d.row.index + 1)) {
        d.cell.styles.fontStyle = "bold"; d.cell.styles.fillColor = [255, 236, 200];
      }
    },
  });
  const y2 = doc.lastAutoTable.finalY + 7;
  bold(doc, 10);
  doc.text(top.length ? `Najkorišćenija pumpa: ${top.map((t) => t.pump).join(", ")} (${top[0].count} vozila)` : "Najkorišćenija pumpa: –", 12, y2);
  return y2;
}

const out = (doc, name) => ({ blob: doc.output("blob"), name });

export async function periodPdf({ from, to, fuelings }) {
  const doc = await newDoc();
  const list = sortDesc(inRange(fuelings, from, to));
  header(doc, "Izveštaj za period", `Od ${fmtDate(from)} do ${fmtDate(to)} · SP Novi Beograd · Prva smena`);
  bold(doc, 11);
  doc.text(`Dan: ${from === to ? `${dayName(from)}, ${fmtDate(from)}` : `${fmtDate(from)} – ${fmtDate(to)}`}`, 12, 36);
  doc.text(`Ukupno vozila: ${list.length}     Ukupno litara: ${fmtL(sumL(list))}`, 12, 43);
  bold(doc, 12); doc.text(`Stigli – redom po vremenu (${list.length})`, 12, 53);
  autoTable(doc, {
    ...base, startY: 56,
    head: [["R.br.", "Datum", "Garažni broj", "Vreme", "Mesto sipanja", "Litara", "Napomena"]],
    body: list.length ? list.map((f, i) => [i + 1, fmtDate(f.date), f.garage, f.time, f.pump, fmtL(f.liters), f.note || ""])
      : [[{ content: "Nema zabeleženih vozila", colSpan: 7, styles: { halign: "center" } }]],
    columnStyles: { 6: { cellWidth: 55 } },
  });
  pumpTable(doc, list, ensure(doc, doc.lastAutoTable.finalY + 10, 85));
  footer(doc);
  return out(doc, `Izvestaj_${from}_${to}.pdf`);
}

export async function weeklyPdf({ start, fuelings }) {
  const doc = await newDoc();
  const end = addDays(start, 6);
  const counts = dayCounts(fuelings, range(start, end));
  const list = inRange(fuelings, start, end);
  header(doc, "Nedeljni pregled", `${fmtShort(start)} – ${fmtDate(end)} · SP Novi Beograd · Prva smena`);
  bold(doc, 11);
  doc.text(`Ukupno vozila: ${list.length}     Ukupno litara: ${fmtL(sumL(list))}`, 12, 36);
  autoTable(doc, {
    ...base, startY: 41,
    head: [["Dan", "Datum", "Broj vozila", "Litara"]],
    body: counts.map((c) => [dayName(c.date), fmtDate(c.date), c.count, fmtL(c.liters)]),
  });
  let y = doc.lastAutoTable.finalY + 10;
  bold(doc, 12); doc.text("Najprometniji dani", 12, y);
  const tops = topDays(counts);
  normal(doc, 10);
  (tops.length ? tops : [null]).forEach((t, i) => {
    y += 7;
    doc.text(t ? `${i + 1}.  ${fmtDate(t.date)}  –  ${t.count} sipanih vozila` : "Nema podataka za ovu nedelju", 16, y);
  });
  pumpTable(doc, list, ensure(doc, y + 12, 85));
  footer(doc);
  return out(doc, `Nedeljni_pregled_${start}_${end}.pdf`);
}

export async function qfPdf({ date, fuelings, totalizer, vehicles, signature }) {
  const doc = await newDoc();
  const day = byDate(fuelings, date).sort((a, b) => a.time.localeCompare(b.time));
  bold(doc, 9); doc.text("QF-E-003", 198, 11, { align: "right" });
  normal(doc, 10); doc.text(`DATUM: ${fmtDate(date)} god.`, 198, 18, { align: "right" });
  bold(doc, 14); doc.text("LISTA TOČENJA GORIVA - NOVI BEOGRAD", 105, 25, { align: "center" });
  normal(doc, 10); doc.text("\"SP Novi Beograd\"", 12, 32);

  const P = totalizer?.pumps || [];
  const v = (i, k) => fmtTot(P[i]?.[k]);
  const diff = (i) => (P[i] && P[i].start != null && P[i].end != null ? P[i].end - P[i].start : null);
  const span = (content, extra = {}) => ({ content, rowSpan: 2, styles: { valign: "middle", ...extra } });
  const tBody = [];
  for (let i = 0; i < 4; i += 1) {
    const a = i; const b = i + 4;
    tBody.push([span(`Automat ${a + 1}`, { fontStyle: "bold" }), "Početno stanje", v(a, "start"), span(fmtTot(diff(a)), { fontStyle: "bold" }),
      span(`Automat ${b + 1}`, { fontStyle: "bold" }), "Početno stanje", v(b, "start"), span(fmtTot(diff(b)), { fontStyle: "bold" })]);
    tBody.push(["Završno stanje", v(a, "end"), "Završno stanje", v(b, "end")]);
  }
  autoTable(doc, {
    ...base, startY: 35, styles: { ...base.styles, fontSize: 8, cellPadding: 1.2 },
    head: [["Automat", "Stanje", "Vrednost", "Razlika", "Automat", "Stanje", "Vrednost", "Razlika"]],
    body: tBody,
  });
  const total = Array.from({ length: 8 }, (_, i) => diff(i)).reduce((s, d) => s + (d || 0), 0);
  let y = doc.lastAutoTable.finalY + 6;
  bold(doc, 10);
  doc.text("SMENA   Od 07h   Do 15h", 60, y);
  doc.text(`UKUPNA RAZLIKA:  ${fmtTot(total)}`, 60, y + 6);
  y += 11;

  const byG = {};
  day.forEach((f) => { (byG[f.garage] = byG[f.garage] || []).push(f); });
  const seed = new Set(SEED_VEHICLES.map(String));
  const known = [...new Set([...vehicles, ...Object.keys(byG)])].sort((a, b) => Number(a) - Number(b));
  const all = [...known.filter((g) => seed.has(g) && g !== "2588"), "2588", ...known.filter((g) => !seed.has(g))];
  const cell = (g) => {
    if (!g) return ["", "", "", ""];
    const fs = byG[g];
    return [g, fs ? fs.map((f) => fmtL(f.liters)).join(" + ") : "", "da / ne", fs ? fs.map((f) => f.time).join(", ") : ""];
  };
  const sub = Array.from({ length: 4 }, () => ["G.br.", "Točena količina", "Ispravn. kartice", "Vreme točenja"]).flat();
  const colW = [11, 14, 10.5, 11];
  const columnStyles = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i, { cellWidth: colW[i % 4], halign: i % 4 === 0 ? "left" : "center" }]));
  const ROW = 4.45;
  let i = 0; let first = true;
  while (i < all.length) {
    const rowsCap = Math.floor(((first ? 282 - y : 270) - 14) / ROW);
    const chunk = all.slice(i, i + rowsCap * 4);
    i += chunk.length;
    const rows = Math.ceil(chunk.length / 4);
    const body = Array.from({ length: rows }, (_, r) => [0, 1, 2, 3].flatMap((c) => cell(chunk[c * rows + r])));
    if (!first) doc.addPage();
    autoTable(doc, {
      ...base, startY: first ? y : 12, columnStyles, rowPageBreak: "avoid",
      styles: { ...base.styles, fontSize: 6.6, cellPadding: 0.7, overflow: "linebreak" },
      head: [[{ content: "EVRODIZEL", colSpan: 16, styles: { halign: "center", fillColor: RED, fontSize: 9 } }],
        sub.map((h) => ({ content: h, styles: { fillColor: [245, 245, 245], textColor: 20, fontSize: 5.8, halign: "center" } }))],
      body,
      didParseCell: (d) => {
        if (d.section === "body") {
          const g = d.row.raw[Math.floor(d.column.index / 4) * 4];
          if (g && byG[g]) { d.cell.styles.fillColor = [255, 243, 214]; d.cell.styles.fontStyle = "bold"; }
          if (d.column.index % 4 === 2) d.cell.styles.textColor = 150;
        }
      },
    });
    first = false;
  }
  y = doc.lastAutoTable.finalY + 14;
  if (y > 268) { doc.addPage(); y = 25; }
  normal(doc, 10);
  if (signature) {
    doc.text("Evidentičar", 20, y);
    bold(doc, 11); doc.text("Puzović Ivica", 20, y + 7);
    doc.setLineWidth(0.3); doc.setDrawColor(0); doc.line(20, y + 14, 80, y + 14);
    normal(doc, 10);
  }
  doc.text("Radnik Knez Petrol-a", 130, y);
  doc.setLineWidth(0.3); doc.setDrawColor(0); doc.line(130, y + 14, 190, y + 14);
  return out(doc, `QF-E-003_Lista_tocenja_${date}.pdf`);
}

export async function deliver({ blob, name }, share) {
  const file = new File([blob], name, { type: "application/pdf" });
  if (share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancel";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return share ? "fallback" : "saved";
}
