import { Pencil } from "lucide-react";
import { fmtL, fmtDate } from "@/lib/dates";

export const FuelingRow = ({ f, index, showDate, onEdit }) => (
  <li className="flex items-center gap-3 border-b border-dashed border-neutral-200 py-2.5 last:border-0" data-testid={`fueling-row-${f.id}`}>
    {index != null && <span className="w-6 font-cond text-sm font-semibold text-neutral-400">{index}.</span>}
    <span className="min-w-[54px] font-display text-2xl leading-none">{f.garage}</span>
    <span className="flex-1 font-cond text-base leading-tight">
      <span className="font-semibold">{showDate ? `${fmtDate(f.date)} ` : ""}{f.time}</span>
      <span className="text-neutral-500"> · mesto </span>
      <span className="font-semibold">{f.pump}</span>
      <span className="text-neutral-500"> · </span>
      <span className="font-semibold">{fmtL(f.liters)} L</span>
      {f.note && <span className="block text-sm italic text-neutral-500">{f.note}</span>}
    </span>
    {onEdit && (
      <button onClick={() => onEdit(f)} aria-label="Izmeni" data-testid={`fueling-edit-${f.id}`}
        className="press grid h-9 w-9 place-items-center rounded-xl border border-neutral-300 text-neutral-600 hover:border-black hover:text-black">
        <Pencil className="h-4 w-4" />
      </button>
    )}
  </li>
);
