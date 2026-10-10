import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { DEFAULT_BUSES } from "@/src/data/buses";
import { storage } from "@/src/utils/storage";

export const ADMIN_PASSWORD = "puzopb";
const SESSION_KEY = "admin_unlocked_v1";
const BUSES_KEY = "bus_list_v1";
const INDEX_KEY = "day_index_v2";
const dayKey = (d: string) => `day_v2:${d}`;

export type Arrival = { id: string; bus: string; pump: number; qty: string; time: string; note: string };
export type Day = { date: string; arrivals: Arrival[] };

export const num = (s: string | undefined) => {
  const v = parseFloat(String(s ?? "").replace(",", "."));
  return isNaN(v) ? 0 : v;
};
export const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
export const dayLiters = (d: Day) => d.arrivals.reduce((a, x) => a + num(x.qty), 0);

const iso = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
export const todayStr = () => iso(new Date());
export const displayDate = (d: string) => {
  const [y, m, dd] = d.split("-");
  return `${dd}.${m}.${y}`;
};
export const shortDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;
export const shiftDate = (d: string, delta: number) => {
  const [y, m, dd] = d.split("-").map(Number);
  return iso(new Date(y, m - 1, dd + delta));
};
export const weekDates = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  const dow = (new Date(y, m - 1, dd).getDay() + 6) % 7; // Monday = 0
  return Array.from({ length: 7 }, (_, i) => shiftDate(d, i - dow));
};
export const DAY_NAMES = ["Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja"];
export const nowTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem(key, null);
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const loadDay = (date: string) => readJSON<Day>(dayKey(date), { date, arrivals: [] });

type Toast = { msg: string; kind: "ok" | "err" } | null;

type Ctx = {
  ready: boolean;
  unlocked: boolean;
  login: (pw: string) => Promise<boolean>;
  logout: () => Promise<void>;
  buses: string[];
  setBuses: (b: string[]) => Promise<void>;
  date: string;
  setDate: (d: string) => void;
  day: Day;
  addArrival: (a: Omit<Arrival, "id">) => void;
  removeArrival: (id: string) => void;
  version: number;
  toast: Toast;
  showToast: (msg: string, kind?: "ok" | "err") => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [buses, setBusesState] = useState<string[]>(DEFAULT_BUSES);
  const [date, setDate] = useState(todayStr());
  const [day, setDay] = useState<Day>({ date: todayStr(), arrivals: [] });
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      setUnlocked((await storage.secureGet<boolean>(SESSION_KEY, false)) === true);
      setBusesState(await readJSON<string[]>(BUSES_KEY, DEFAULT_BUSES));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    loadDay(date).then(setDay);
  }, [date]);

  const showToast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, kind });
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const login = async (pw: string) => {
    if (pw !== ADMIN_PASSWORD) return false;
    await storage.secureSet(SESSION_KEY, true);
    setUnlocked(true);
    return true;
  };
  const logout = async () => {
    await storage.secureRemove(SESSION_KEY);
    setUnlocked(false);
  };

  const setBuses = async (b: string[]) => {
    setBusesState(b);
    await storage.setItem(BUSES_KEY, JSON.stringify(b));
  };

  const persist = (next: Day) => {
    storage.setItem(dayKey(next.date), JSON.stringify(next));
    readJSON<string[]>(INDEX_KEY, []).then((idx) => {
      if (!idx.includes(next.date)) storage.setItem(INDEX_KEY, JSON.stringify([...idx, next.date].sort()));
    });
    setVersion((v) => v + 1);
  };

  const addArrival = (a: Omit<Arrival, "id">) =>
    setDay((prev) => {
      const next = { ...prev, arrivals: [...prev.arrivals, { ...a, id: `${Date.now()}-${a.bus}` }] };
      persist(next);
      return next;
    });

  const removeArrival = (id: string) =>
    setDay((prev) => {
      const next = { ...prev, arrivals: prev.arrivals.filter((x) => x.id !== id) };
      persist(next);
      return next;
    });

  return (
    <AppCtx.Provider
      value={{
        ready, unlocked, login, logout, buses, setBuses, date, setDate, day, addArrival, removeArrival,
        version, toast, showToast,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
