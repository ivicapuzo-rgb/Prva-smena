import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { DateNav } from "@/components/DateNav";
import { DosloBadge } from "@/components/DosloBadge";
import { SyncBadge } from "@/components/SyncBadge";
import { FuelForm } from "@/components/FuelForm";
import { Totalizers } from "@/components/Totalizers";

export default function Smena() {
  return (
    <div data-testid="smena-page">
      <header className="relative h-64 overflow-hidden">
        <img src="/img/hero.jpg" alt="Radno mesto evidentičara" className="absolute inset-0 h-full w-full object-cover object-[center_40%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <SyncBadge dark />
          <Link to="/admin" data-testid="admin-link" className="press inline-flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 font-cond text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-md hover:bg-black/75">
            <ShieldCheck className="h-3.5 w-3.5" /> Admin
          </Link>
        </div>
        <h1 className="rise absolute bottom-4 left-5 font-display text-6xl uppercase leading-none text-[var(--ps-amber)] drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]" data-testid="smena-title">
          Prva smena
        </h1>
      </header>
      <div className="space-y-6 px-4 pt-6">
        <div className="rise rise-1"><DateNav /></div>
        <div className="rise rise-2"><DosloBadge /></div>
        <div className="rise rise-3"><FuelForm /></div>
        <div className="rise rise-4"><Totalizers /></div>
        <footer className="pb-4 pt-6 text-center font-display text-2xl leading-tight" data-testid="app-signature">
          Aplikaciju dizajnirao i uradio <span className="text-[var(--ps-amber)]">EVIDENTIČAR</span>{" "}
          <span className="text-[var(--ps-red)]">Puzović Ivica</span>
        </footer>
      </div>
    </div>
  );
}
