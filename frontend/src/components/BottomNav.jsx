import { NavLink, useLocation } from "react-router-dom";
import { Fuel, Bus, BarChart3 } from "lucide-react";

const TABS = [
  { to: "/", label: "Smena", icon: Fuel, id: "nav-smena" },
  { to: "/vozila", label: "Vozila", icon: Bus, id: "nav-vozila" },
  { to: "/izvestaj", label: "Izveštaj", icon: BarChart3, id: "nav-izvestaj" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  if (pathname === "/admin") return null;
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white/90 px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur-xl" data-testid="bottom-nav">
      <div className="grid grid-cols-3 gap-2">
        {TABS.map(({ to, label, icon: Icon, id }) => (
          <NavLink key={to} to={to} end data-testid={id}
            className={({ isActive }) => `press flex flex-col items-center gap-0.5 rounded-2xl py-2 font-cond text-sm font-semibold uppercase tracking-wide ${isActive ? "bg-[var(--ps-red)] text-white" : "text-neutral-500 hover:text-black"}`}>
            <Icon className="h-5 w-5" strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
