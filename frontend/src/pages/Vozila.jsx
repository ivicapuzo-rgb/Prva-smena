import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { byDate, sortDesc, sumL } from "@/lib/stats";
import { fmtL } from "@/lib/dates";
import { DateNav } from "@/components/DateNav";
import { DosloBadge } from "@/components/DosloBadge";
import { FuelingRow } from "@/components/FuelingRow";
import { EditFuelingDialog } from "@/components/EditFuelingDialog";
import { Card, inputCls } from "@/components/ui-kit";

const History = ({ garage, list, onEdit }) => (
  <Card testId="vehicle-history">
    <div className="flex items-end justify-between">
      <h2 className="font-display text-5xl leading-none" data-testid="vehicle-history-garage">{garage}</h2>
      <span className="text-right font-cond text-sm text-neutral-500">{list.length} točenja · {fmtL(sumL(list))} L</span>
    </div>
    {list.length ? (
      <ul className="mt-3">{list.map((f) => <FuelingRow key={f.id} f={f} showDate onEdit={onEdit} />)}</ul>
    ) : <p className="mt-3 font-cond text-lg text-neutral-500" data-testid="vehicle-history-empty">Vozilo još nije bilo na pumpi.</p>}
  </Card>
);

const AddVehicle = ({ open, onClose }) => {
  const { addVehicle, vehicles } = useStore();
  const [g, setG] = useState("");
  const save = () => {
    if (!/^\d+$/.test(g)) return toast.error("Unesite garažni broj");
    if (!addVehicle(g)) return toast.error(`Vozilo ${g} je već na spisku`);
    const sorted = [...vehicles, g].sort((a, b) => Number(a) - Number(b));
    const i = sorted.indexOf(g);
    toast.success(`Vozilo ${g} dodato`, { description: `Mesto u spisku: posle ${sorted[i - 1] || "–"}, pre ${sorted[i + 1] || "–"}` });
    setG(""); onClose();
    return undefined;
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-sm rounded-3xl" data-testid="add-vehicle-dialog">
        <DialogHeader><DialogTitle className="font-display text-3xl font-normal">Dodaj vozilo</DialogTitle></DialogHeader>
        <input autoFocus value={g} onChange={(e) => setG(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="npr. 7700"
          className={inputCls} data-testid="add-vehicle-input" onKeyDown={(e) => e.key === "Enter" && save()} />
        <button onClick={save} data-testid="add-vehicle-save-button" className="press h-14 rounded-2xl bg-[var(--ps-red)] font-display text-xl uppercase text-white">Dodaj na spisak</button>
      </DialogContent>
    </Dialog>
  );
};

export default function Vozila() {
  const { fuelings, vehicles, date } = useStore();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const today = useMemo(() => new Set(byDate(fuelings, date).map((f) => f.garage)), [fuelings, date]);
  const matches = q ? vehicles.filter((v) => v.startsWith(q)) : vehicles;
  const exact = q && vehicles.includes(q) ? q : null;
  const history = exact ? sortDesc(fuelings.filter((f) => f.garage === exact)) : [];

  return (
    <div className="space-y-6 px-4 pt-6" data-testid="vozila-page">
      <h1 className="rise font-display text-6xl uppercase leading-none">Vozila</h1>
      <div className="rise rise-1"><DateNav /></div>
      <div className="rise rise-2"><DosloBadge /></div>
      <div className="rise rise-3 relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input value={q} onChange={(e) => setQ(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Pretraga po garažnom broju"
          className="h-16 w-full rounded-2xl border border-[var(--ps-red)] bg-white pl-12 pr-12 font-cond text-xl font-medium outline-none focus:shadow-[0_0_0_4px_rgba(225,6,0,0.12)]"
          data-testid="vehicle-search-input" />
        {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-2" data-testid="vehicle-search-clear" aria-label="Obriši"><X className="h-5 w-5" /></button>}
      </div>
      {exact && <History garage={exact} list={history} onEdit={setEdit} />}
      {q && !exact && !matches.length && (
        <p className="font-cond text-lg text-neutral-500" data-testid="vehicle-search-empty">Vozilo {q} nije na spisku. Dodajte ga dugmetom ispod.</p>
      )}
      <section className="rise rise-4" data-testid="vehicle-list">
        <h2 className="mb-3 font-cond text-lg font-semibold uppercase tracking-wide text-neutral-600">
          {q ? `Rezultati (${matches.length})` : `Spisak vozila (${vehicles.length})`}
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {matches.map((v) => (
            <button key={v} onClick={() => setQ(v)} data-testid={`vehicle-chip-${v}`}
              className={`press relative rounded-xl border py-2.5 font-cond text-lg font-semibold ${v === exact ? "border-black bg-black text-white" : "border-neutral-200 bg-white hover:border-[var(--ps-amber)]"}`}>
              {today.has(v) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#22e14a]" />}
              {v}
            </button>
          ))}
        </div>
      </section>
      <button onClick={() => setAdding(true)} data-testid="add-vehicle-button"
        className="press fixed bottom-24 right-[max(1rem,calc(50%-14rem+1rem))] z-30 flex h-16 items-center gap-3 rounded-2xl border border-black bg-[#ff0000] px-6 font-display text-2xl text-black shadow-[0_12px_28px_rgba(225,6,0,0.35)] hover:bg-[#e10600]">
        <Plus className="h-7 w-7" strokeWidth={3} /> Dodaj vozilo
      </button>
      <AddVehicle open={adding} onClose={() => setAdding(false)} />
      <EditFuelingDialog fueling={edit} onClose={() => setEdit(null)} />
    </div>
  );
}
