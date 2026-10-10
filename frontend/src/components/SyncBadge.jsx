import { CloudCheck, HardDrive, WifiOff, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";

export const SyncBadge = ({ dark }) => {
  const { online, pending, syncing } = useStore();
  let Icon = CloudCheck; let label = "Sinhronizovano"; let tone = "text-[var(--ps-green)]";
  if (!online) { Icon = WifiOff; label = pending ? `Sačuvano na uređaju (${pending})` : "Bez interneta"; tone = "text-[var(--ps-amber)]"; }
  else if (syncing) { Icon = RefreshCw; label = "Slanje…"; tone = "text-[var(--ps-blue)]"; }
  else if (pending) { Icon = HardDrive; label = `Sačuvano na uređaju (${pending})`; tone = "text-[var(--ps-amber)]"; }
  return (
    <span data-testid="sync-status" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-cond text-xs font-semibold uppercase tracking-wide ${dark ? "bg-black/55 backdrop-blur-md" : "bg-neutral-100"} ${tone}`}>
      <Icon className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
};
