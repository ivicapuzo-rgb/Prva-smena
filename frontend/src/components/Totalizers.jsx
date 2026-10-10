import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gauge } from "lucide-react";
import { useStore } from "@/lib/store";
import { parseNum, fmtTot } from "@/lib/dates";
import { Card } from "@/components/ui-kit";

const emptyRows = () => Array.from({ length: 8 }, () => ({ start: "", end: "" }));
const cell = "w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-2 py-2 font-cond text-lg font-semibold outline-none focus:border-[var(--ps-amber)]";

export const Totalizers = () => {
  const { db, date, saveTotalizer } = useStore();
  const saved = db.totalizers[date];
  const [rows, setRows] = useState(emptyRows);

  useEffect(() => {
    setRows(saved ? saved.pumps.map((p) => ({ start: fmtTot(p.start), end: fmtTot(p.end) })) : emptyRows());
  }, [date, saved?.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (i, k, v) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v.replace(/[^\d.,]/g, "") } : x)));
  const diff = (r) => {
    const s = parseNum(r.start); const e = parseNum(r.end);
    return s != null && e != null ? e - s : null;
  };
  const total = rows.reduce((s, r) => s + (diff(r) || 0), 0);

  const save = () => {
    saveTotalizer(date, rows.map((r) => ({ start: parseNum(r.start), end: parseNum(r.end) })));
    toast.success("Totalizatori sačuvani");
  };

  return (
    <Card testId="totalizers-card">
      <h2 className="flex items-center gap-2 font-display text-3xl uppercase"><Gauge className="h-7 w-7 text-[var(--ps-red)]" /> Totalizatori 1–8</h2>
      <p className="mb-4 font-cond text-sm text-neutral-500">
        {saved ? `Sačuvano ${new Date(saved.updated_at).toLocaleTimeString("sr-Latn", { hour: "2-digit", minute: "2-digit" })}` : "Upišite jednom na početku i na kraju smene"}
      </p>
      <div className="grid grid-cols-[52px_1fr_1fr_64px] items-center gap-2 font-cond text-xs font-semibold uppercase text-neutral-500">
        <span>Aut.</span><span>Početno</span><span>Završno</span><span className="text-right">Razlika</span>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[52px_1fr_1fr_64px] items-center gap-2" data-testid={`totalizer-row-${i + 1}`}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-black font-digits text-sm text-white">{i + 1}</span>
            <input value={r.start} onChange={(e) => set(i, "start", e.target.value)} inputMode="decimal" className={cell} data-testid={`totalizer-start-${i + 1}`} />
            <input value={r.end} onChange={(e) => set(i, "end", e.target.value)} inputMode="decimal" className={cell} data-testid={`totalizer-end-${i + 1}`} />
            <span className="text-right font-cond text-lg font-bold" data-testid={`totalizer-diff-${i + 1}`}>{fmtTot(diff(r)) || "–"}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-neutral-100 px-4 py-3">
        <span className="font-cond text-base font-semibold uppercase">Ukupna razlika</span>
        <span className="font-digits text-lg" data-testid="totalizer-total">{fmtTot(total) || "0"}</span>
      </div>
      <button onClick={save} data-testid="totalizer-save-button"
        className="press mt-4 h-14 w-full rounded-2xl bg-[var(--ps-red)] font-display text-xl uppercase tracking-wide text-white hover:bg-[#c00500]">
        Sačuvaj totalizatore
      </button>
    </Card>
  );
};
