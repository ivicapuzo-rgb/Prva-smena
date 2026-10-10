import { useMemo, useState } from "react";
import { FileDown, Share2, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { byDate, sortDesc, pumpStats, dayCounts, topDays, inRange, sumL } from "@/lib/stats";
import { addDays, fmtDate, fmtShort, fmtL, range, weekStart } from "@/lib/dates";
import { periodPdf, weeklyPdf, qfPdf } from "@/lib/pdf";
import { usePdf } from "@/lib/usePdf";
import { DateNav } from "@/components/DateNav";
import { FuelingRow } from "@/components/FuelingRow";
import { EditFuelingDialog } from "@/components/EditFuelingDialog";
import { MiniBars } from "@/components/MiniBars";
import { Card, CardTitle, Bars, BlueBtn } from "@/components/ui-kit";

const dateInput = "w-full rounded-xl border border-black px-3 py-2 font-cond text-base outline-none focus:border-[var(--ps-amber)]";

export default function Izvestaj() {
  const { fuelings, date, db, vehicles, setSetting } = useStore();
  const [edit, setEdit] = useState(null);
  const [from, setFrom] = useState(date);
  const [to, setTo] = useState(date);
  const { busy, run } = usePdf();

  const day = useMemo(() => sortDesc(byDate(fuelings, date)), [fuelings, date]);
  const { pumps, top } = pumpStats(day);
  const ws = weekStart(date);
  const week = dayCounts(fuelings, range(ws, addDays(ws, 6)));
  const weekTotal = week.reduce((s, d) => s + d.count, 0);
  const busiest = topDays(week);
  const last14 = dayCounts(fuelings, range(addDays(date, -13), date)).map((d) => ({ ...d, label: fmtShort(d.date).slice(0, 5) }));
  const period = inRange(fuelings, from <= to ? from : to, from <= to ? to : from);
  const signature = db.settings.signature;

  const weekly = () => weeklyPdf({ start: ws, fuelings });
  const per = () => periodPdf({ from: from <= to ? from : to, to: from <= to ? to : from, fuelings });
  const qf = () => qfPdf({ date, fuelings, totalizer: db.totalizers[date], vehicles, signature });

  return (
    <div className="space-y-6 px-4 pt-6" data-testid="izvestaj-page">
      <h1 className="rise font-digits text-4xl font-bold leading-none tracking-wide">Izveštaj</h1>
      <div className="rise rise-1"><DateNav /></div>

      <Card testId="report-arrivals" className="rise rise-2">
        <CardTitle>Stigli – redom po vremenu <span data-testid="report-arrivals-count">({day.length})</span></CardTitle>
        {day.length ? (
          <ul>{day.map((f, i) => <FuelingRow key={f.id} f={f} index={i + 1} onEdit={setEdit} />)}</ul>
        ) : <p className="font-cond text-lg text-neutral-400">Nema vozila za {fmtDate(date)}</p>}
        {day.length > 0 && <p className="mt-2 text-right font-cond text-sm font-semibold text-neutral-500">Ukupno {fmtL(sumL(day))} L</p>}
      </Card>

      <Card testId="report-pump-stats" className="rise rise-3">
        <CardTitle icon={<Bars size={44} />}>Statistika mesta sipanja</CardTitle>
        <div className="grid grid-cols-4 gap-2">
          {pumps.map((p) => (
            <div key={p.pump} data-testid={`pump-stat-${p.pump}`}
              className={`rounded-xl border px-2 py-2 text-center ${top.some((t) => t.pump === p.pump) ? "border-[var(--ps-red)] bg-red-50" : "border-neutral-200"}`}>
              <span className="block font-cond text-xs font-semibold uppercase text-neutral-500">Pumpa {p.pump}</span>
              <span className="font-display text-2xl">{p.count}</span>
            </div>
          ))}
        </div>
        <MiniBars data={pumps.map((p) => ({ ...p, label: String(p.pump) }))} xKey="label" highlight={(d) => top.some((t) => t.pump === d.pump)} testId="pump-chart" height={140} />
        <p className="font-cond text-base font-semibold" data-testid="pump-top">
          Najkorišćenija pumpa: {top.length ? <span className="text-[var(--ps-red)]">{top.map((t) => t.pump).join(", ")} ({top[0].count} vozila)</span> : "–"}
        </p>
      </Card>

      <Card testId="report-weekly" className="rise rise-4">
        <CardTitle icon={<Bars />}>Nedeljni pregled</CardTitle>
        <p className="font-cond text-3xl" data-testid="weekly-range">{fmtShort(ws)}–{fmtShort(addDays(ws, 6))}</p>
        <p className="mt-1 font-cond text-base text-neutral-500">Ukupno vozila: <b className="text-black" data-testid="weekly-total">{weekTotal}</b></p>
        <h3 className="mt-5 font-cond text-2xl">Najprometniji dani</h3>
        <ol className="mt-2 space-y-1" data-testid="weekly-busiest">
          {busiest.length ? busiest.map((d, i) => (
            <li key={d.date} className="flex items-baseline gap-4 font-cond">
              <span className="text-sm">{i + 1}.</span>
              <span className="text-sm">{fmtDate(d.date)}</span>
              <span className="text-lg font-semibold text-[var(--ps-green)]">{d.count} sipanih vozila</span>
            </li>
          )) : <li className="font-cond text-neutral-400">Nema podataka za ovu nedelju</li>}
        </ol>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <BlueBtn testId="weekly-pdf-button" disabled={!!busy} onClick={() => run("w", weekly, false)}><FileDown className="h-5 w-5" />{busy === "w" ? "…" : "Nedeljni PDF"}</BlueBtn>
          <BlueBtn testId="weekly-share-button" disabled={!!busy} onClick={() => run("ws", weekly, true)}><Share2 className="h-5 w-5" />Podeli</BlueBtn>
        </div>
      </Card>

      <Card testId="report-14days">
        <CardTitle icon={<Bars size={40} />}>Grafikon po danima (14 dana)</CardTitle>
        <MiniBars data={last14} xKey="label" highlight={(d) => d.date === date} testId="days-chart" height={180} />
      </Card>

      <Card testId="report-period">
        <h3 className="mb-3 font-cond text-lg font-semibold">Izvezi izveštaj za period</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="font-cond text-xs text-neutral-500">Od<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={dateInput} data-testid="period-from-input" /></label>
          <label className="font-cond text-xs text-neutral-500">Do<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={dateInput} data-testid="period-to-input" /></label>
          <BlueBtn variant="outline" testId="period-export-button" disabled={!!busy} onClick={() => run("p", per, false)}><FileDown className="h-4 w-4" />Izvezi izveštaj</BlueBtn>
          <BlueBtn variant="outline" testId="period-share-button" disabled={!!busy} onClick={() => run("ps", per, true)}><Share2 className="h-4 w-4" />Podeli</BlueBtn>
        </div>
        <p className="mt-3 font-cond text-sm text-neutral-500" data-testid="period-summary">U periodu: {period.length} vozila · {fmtL(sumL(period))} L</p>
      </Card>

      <Card testId="report-qf" tone="amber">
        <CardTitle icon={<FileText className="h-7 w-7 text-[var(--ps-amber)]" />}>Detaljni izveštaj – QF-E-003</CardTitle>
        <p className="font-cond text-base text-neutral-600">Lista točenja goriva – Novi Beograd za {fmtDate(date)}: totalizatori, EVRODIZEL tabela svih vozila sa litražom i vremenom.</p>
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-neutral-100 px-4 py-3">
          <Checkbox checked={signature} onCheckedChange={(v) => setSetting("signature", !!v)} data-testid="qf-signature-checkbox" className="h-6 w-6 border-2" />
          <span className="font-cond text-base font-semibold">Uključi potpis na kraju izveštaja</span>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <BlueBtn testId="qf-pdf-button" disabled={!!busy} onClick={() => run("q", qf, false)}><FileDown className="h-5 w-5" />{busy === "q" ? "…" : "Izvezi PDF"}</BlueBtn>
          <BlueBtn testId="qf-share-button" disabled={!!busy} onClick={() => run("qs", qf, true)}><Share2 className="h-5 w-5" />Podeli</BlueBtn>
        </div>
      </Card>

      <EditFuelingDialog fueling={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
