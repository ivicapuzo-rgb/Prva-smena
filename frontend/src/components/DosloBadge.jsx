import { useStore } from "@/lib/store";
import { byDate } from "@/lib/stats";

export const DosloBadge = () => {
  const { fuelings, date } = useStore();
  const n = byDate(fuelings, date).length;
  return (
    <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-[22px] border-2 border-[var(--ps-amber)] bg-white" data-testid="doslo-badge">
      <span className="flex items-center gap-1 font-digits text-[9px] uppercase">
        <span className="h-2 w-2 rounded-full bg-[#22e14a]" /> Došlo
      </span>
      <span className="font-display text-4xl leading-none" data-testid="doslo-count">{n}</span>
    </div>
  );
};
