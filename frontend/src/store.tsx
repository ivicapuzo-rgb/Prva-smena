import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { DEFAULT_BUSES } from "@/src/data/buses";
import { storage } from "@/src/utils/storage";

export const ADMIN_PASSWORD = "puzopb";
const SESSION_KEY = "admin_unlocked_v1";
const BUSES_KEY = "bus_list_v1";
const INDEX_KEY = "shift_index_v1";
const shiftKey = (d: string) => `shift_v1:${d}`;

export type Pump = { start: string; end: string };
export type Entry = { qty: string; card: "да" | "не"; time: string };
export type Shift = {
  date: string; // YYYY-MM-DD
  pumps: Pump[];
  entries: Record<string, Entry>;
  evidenticar: string;
  radnik: string;
};

export const num = (s: string | undefined) => {
  const v = parseFloat(String(s ?? "").replace(",", "."));
  return isNaN(v) ? 0 : v;
};
export const fmt = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
export const pumpDiff = (p: Pump) => (p.end.trim() === "" ? 0 : num(p.end) - num(p.start));
export const totalDiff = (s: Shift) => s.pumps.reduce((a, p) => a + pumpDiff(p), 0);
export const totalLiters = (s: Shift) =>
  Object.values(s.entries).reduce((a, e) => a + num(e.qty), 0);

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const displayDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
export const shiftDate = (iso: string, delta: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

export const emptyShift = (date: string): Shift => ({
  date,
  pumps: Array.from({ length: 8 }, () => ({ start: "", end: "" })),
  entries: {},
  evidenticar: "",
  radnik: "",
});

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem(key, null);
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadShift(date: string): Promise<Shift> {
  return readJSON<Shift>(shiftKey(date), emptyShift(date));
}

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
  shift: Shift;
  updateShift: (fn: (s: Shift) => Shift) => void;
  savedDates: string[];
  deleteShift: (d: string) => Promise<void>;
  toast: Toast;
  showToast: (msg: string, kind?: "ok" | "err") => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [buses, setBusesState] = useState<string[]>(DEFAULT_BUSES);
  const [date, setDate] = useState(todayStr());
  const [shift, setShift] = useState<Shift>(emptyShift(todayStr()));
  const [savedDates, setSavedDates] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const u = await storage.secureGet<boolean>(SESSION_KEY, false);
      setUnlocked(u === true);
      setBusesState(await readJSON<string[]>(BUSES_KEY, DEFAULT_BUSES));
      setSavedDates(await readJSON<string[]>(INDEX_KEY, []));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    loadShift(date).then(setShift);
  }, [date]);

  const showToast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
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

  const updateShift = (fn: (s: Shift) => Shift) => {
    setShift((prev) => {
      const next = fn(prev);
      storage.setItem(shiftKey(next.date), JSON.stringify(next));
      setSavedDates((idx) => {
        if (idx.includes(next.date)) return idx;
        const n = [...idx, next.date].sort().reverse();
        storage.setItem(INDEX_KEY, JSON.stringify(n));
        return n;
      });
      return next;
    });
  };

  const deleteShift = async (d: string) => {
    await storage.removeItem(shiftKey(d));
    const n = savedDates.filter((x) => x !== d);
    setSavedDates(n);
    await storage.setItem(INDEX_KEY, JSON.stringify(n));
    if (d === date) setShift(emptyShift(d));
  };

  return (
    <AppCtx.Provider
      value={{
        ready, unlocked, login, logout, buses, setBuses, date, setDate, shift, updateShift,
        savedDates, deleteShift, toast, showToast,
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
