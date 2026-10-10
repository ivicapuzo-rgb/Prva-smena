import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { parseNum, fmtL } from "@/lib/dates";
import { PumpPicker } from "@/components/PumpPicker";
import { Field, inputCls } from "@/components/ui-kit";

export const EditFuelingDialog = ({ fueling, onClose }) => {
  const { updateFueling, deleteFueling } = useStore();
  const [f, setF] = useState(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    setConfirm(false);
    setF(fueling ? { ...fueling, liters: fmtL(fueling.liters) } : null);
  }, [fueling]);

  if (!f) return null;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const save = () => {
    const l = parseNum(f.liters);
    if (!/^\d+$/.test(f.garage) || !l || !f.time || !f.date) return toast.error("Proverite unete podatke");
    updateFueling(f.id, { garage: f.garage, pump: f.pump, liters: l, time: f.time, date: f.date, note: f.note || "" });
    toast.success("Točenje izmenjeno");
    onClose();
    return undefined;
  };
  const remove = () => {
    if (!confirm) return setConfirm(true);
    deleteFueling(f.id);
    toast.success("Točenje obrisano");
    onClose();
    return undefined;
  };

  return (
    <Dialog open={!!fueling} onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-h-[92vh] max-w-sm overflow-y-auto rounded-3xl" data-testid="edit-fueling-dialog">
        <DialogHeader><DialogTitle className="font-display text-3xl font-normal">Izmena točenja</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Field label="Garažni broj">
            <input value={f.garage} onChange={(e) => set("garage", e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={inputCls} data-testid="edit-garage-input" />
          </Field>
          <Field label="Mesto sipanja"><PumpPicker value={f.pump} onChange={(v) => set("pump", v)} prefix="edit-pump" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Litara"><input value={f.liters} onChange={(e) => set("liters", e.target.value)} inputMode="decimal" className={inputCls} data-testid="edit-liters-input" /></Field>
            <Field label="Vreme"><input type="time" value={f.time} onChange={(e) => set("time", e.target.value)} className={inputCls} data-testid="edit-time-input" /></Field>
          </div>
          <Field label="Datum"><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} className={`${inputCls} text-xl`} data-testid="edit-date-input" /></Field>
          <Field label="Napomena"><input value={f.note || ""} onChange={(e) => set("note", e.target.value)} className={`${inputCls} text-lg`} data-testid="edit-note-input" /></Field>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button onClick={remove} data-testid="edit-delete-button"
              className={`press flex h-12 items-center justify-center gap-2 rounded-xl border-2 font-cond text-lg font-semibold ${confirm ? "border-[var(--ps-red)] bg-[var(--ps-red)] text-white" : "border-[var(--ps-red)] text-[var(--ps-red)]"}`}>
              <Trash2 className="h-4 w-4" /> {confirm ? "Potvrdi" : "Obriši"}
            </button>
            <button onClick={save} data-testid="edit-save-button" className="press h-12 rounded-xl bg-black font-cond text-lg font-semibold text-white">Sačuvaj</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
