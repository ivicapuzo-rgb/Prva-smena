import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { nowTime, parseNum, fmtL } from "@/lib/dates";
import { PumpPicker } from "@/components/PumpPicker";
import { Card, Field, inputCls } from "@/components/ui-kit";

export const FuelForm = () => {
  const { addFueling, date, vehicles } = useStore();
  const [garage, setGarage] = useState("");
  const [pump, setPump] = useState(null);
  const [liters, setLiters] = useState("");
  const [time, setTime] = useState(nowTime());
  const [manual, setManual] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (manual) return undefined;
    const iv = setInterval(() => setTime(nowTime()), 15000);
    return () => clearInterval(iv);
  }, [manual]);

  const g = garage.trim();
  const isNew = g && !vehicles.includes(g);

  const save = () => {
    const l = parseNum(liters);
    if (!/^\d+$/.test(g)) return toast.error("Unesite garažni broj (samo cifre)");
    if (!pump) return toast.error("Izaberite mesto sipanja 1–8");
    if (l == null || l <= 0) return toast.error("Unesite litražu, npr. 23,45");
    const { isNew: added } = addFueling({ garage: g, pump, liters: l, date, time, note: note.trim() });
    toast.success(`Vozilo ${g} – mesto ${pump}, ${fmtL(l)} L, ${time}`, { description: added ? "Novo vozilo je dodato na spisak" : undefined });
    setGarage(""); setPump(null); setLiters(""); setNote(""); setManual(false); setTime(nowTime());
    return undefined;
  };

  return (
    <Card tone="amber" testId="fuel-form">
      <h2 className="font-display text-5xl leading-none">Unesi vozilo</h2>
      <div className="mt-5 space-y-5">
        <Field label="Garažni broj">
          <input value={garage} onChange={(e) => setGarage(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="npr. 7000"
            className={`${inputCls} max-w-[220px]`} data-testid="fuel-garage-input" />
          {isNew && <span className="mt-1.5 block font-cond text-sm font-semibold text-[var(--ps-red)]" data-testid="fuel-new-vehicle-hint">Novo vozilo – biće dodato na spisak</span>}
        </Field>
        <Field label="Mesto sipanja (1–8)">
          <PumpPicker value={pump} onChange={setPump} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Točena količina (L)">
            <input value={liters} onChange={(e) => setLiters(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="23,45"
              className={inputCls} data-testid="fuel-liters-input" />
          </Field>
          <Field label={manual ? "Vreme (ručno)" : "Vreme (automatski)"}>
            <div className="relative">
              <input type="time" value={time} onChange={(e) => { setTime(e.target.value); setManual(true); }}
                className={inputCls} data-testid="fuel-time-input" />
              {manual && (
                <button type="button" onClick={() => { setManual(false); setTime(nowTime()); }} data-testid="fuel-time-reset-button"
                  className="absolute -bottom-6 right-0 flex items-center gap-1 font-cond text-xs font-semibold text-[var(--ps-blue)]">
                  <Clock className="h-3 w-3" /> Trenutno vreme
                </button>
              )}
            </div>
          </Field>
        </div>
        <Field label="Napomena (nije obavezno)">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. kartica ne radi"
            className={`${inputCls} text-lg`} data-testid="fuel-note-input" />
        </Field>
        <button onClick={save} data-testid="fuel-save-button"
          className="press flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[var(--ps-amber)] font-display text-2xl uppercase tracking-wide text-black shadow-[0_10px_24px_rgba(245,166,35,0.35)] hover:bg-[#e8961a]">
          <Save className="h-6 w-6" /> Sačuvaj dolazak
        </button>
      </div>
    </Card>
  );
};
