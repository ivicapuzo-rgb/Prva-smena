import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { addDays, fmtDate, today, dayName } from "@/lib/dates";

const Arrow = ({ dir, onClick, testId }) => (
  <button onClick={onClick} data-testid={testId} aria-label={dir === "l" ? "Prethodni dan" : "Sledeći dan"}
    className="press grid h-[72px] w-14 shrink-0 place-items-center rounded-2xl border border-[var(--ps-red)] text-[var(--ps-red)] hover:bg-red-50">
    {dir === "l" ? <ChevronLeft className="h-7 w-7" strokeWidth={1.5} /> : <ChevronRight className="h-7 w-7" strokeWidth={1.5} />}
  </button>
);

export const DateNav = () => {
  const { date, setDate } = useStore();
  const isToday = date === today();
  return (
    <div className="flex items-center gap-3" data-testid="date-nav">
      <Arrow dir="l" onClick={() => setDate(addDays(date, -1))} testId="date-prev-button" />
      <label className="relative flex-1 cursor-pointer rounded-2xl border-2 border-[var(--ps-red)] px-4 py-2">
        <span className="font-digits block text-[10px] uppercase tracking-[0.2em] text-neutral-700">Datum</span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-digits text-[22px] leading-tight text-black" data-testid="date-value">{fmtDate(date).slice(0, -1)}</span>
          <button type="button" onClick={(e) => { e.preventDefault(); setDate(today()); }} data-testid="date-today-button"
            className={`font-digits text-[11px] ${isToday ? "text-black" : "text-[var(--ps-red)] underline underline-offset-2"}`}>
            {isToday ? "Danas" : dayName(date).slice(0, 3)}
          </button>
        </span>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} data-testid="date-picker-input"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0" style={{ colorScheme: "light" }} />
      </label>
      <Arrow dir="r" onClick={() => setDate(addDays(date, 1))} testId="date-next-button" />
    </div>
  );
};
