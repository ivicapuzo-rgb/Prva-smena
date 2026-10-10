import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SEED_VEHICLES } from "@/data/vehicles";
import { today } from "@/lib/dates";

const KEY = "prva_smena_db_v1";
export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const KINDS = ["fuelings", "totalizers", "vehicles"];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const nowISO = () => new Date().toISOString();
const blank = () => ({
  fuelings: {}, totalizers: {}, vehicles: {},
  dirty: { fuelings: [], totalizers: [], vehicles: [] },
  settings: { signature: true }, deviceId: uid(), lastSync: null,
});
const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) return { ...blank(), ...s, dirty: { ...blank().dirty, ...s.dirty }, settings: { ...blank().settings, ...s.settings } };
  } catch (e) { /* corrupted storage */ }
  return blank();
};

export const sortGarages = (a) => [...a].sort((x, y) => Number(x) - Number(y) || x.localeCompare(y));
export const mergeVehicles = (added) => sortGarages([...new Set([...SEED_VEHICLES.map(String), ...added])]);

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [db, setDb] = useState(load);
  const [date, setDate] = useState(today());
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const dbRef = useRef(db);
  dbRef.current = db;
  const busy = useRef(false);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)); }, [db]);

  const sync = useCallback(async () => {
    if (busy.current || !navigator.onLine) return;
    busy.current = true;
    setSyncing(true);
    const cur = dbRef.current;
    const payload = {};
    const sent = {};
    KINDS.forEach((k) => {
      payload[k] = cur.dirty[k].map((id) => cur[k][id]).filter(Boolean);
      sent[k] = Object.fromEntries(payload[k].map((r) => [r.id, r.updated_at]));
    });
    try {
      const res = await fetch(`${API}/sync`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setDb((p) => {
        const n = { ...p, dirty: { ...p.dirty }, lastSync: nowISO() };
        KINDS.forEach((k) => {
          const m = { ...p[k] };
          const dirty = new Set(p.dirty[k].filter((id) => !(sent[k][id] && p[k][id]?.updated_at === sent[k][id])));
          (data[k] || []).forEach((r) => {
            const l = m[r.id];
            if (dirty.has(r.id) && l && l.updated_at > r.updated_at) return;
            m[r.id] = r;
          });
          n[k] = m;
          n.dirty[k] = [...dirty];
        });
        return n;
      });
      setOnline(true);
    } catch (e) {
      setOnline(navigator.onLine);
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, []);

  const pending = KINDS.reduce((s, k) => s + db.dirty[k].length, 0);

  useEffect(() => {
    const t = setTimeout(sync, pending ? 600 : 0);
    return () => clearTimeout(t);
  }, [pending, sync]);

  useEffect(() => {
    const on = () => { setOnline(true); sync(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const iv = setInterval(sync, 30000);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); clearInterval(iv); };
  }, [sync]);

  const put = (k, rec) => setDb((p) => ({
    ...p,
    [k]: { ...p[k], [rec.id]: rec },
    dirty: { ...p.dirty, [k]: p.dirty[k].includes(rec.id) ? p.dirty[k] : [...p.dirty[k], rec.id] },
  }));

  const vehicles = useMemo(
    () => mergeVehicles(Object.values(db.vehicles).filter((v) => !v.deleted).map((v) => v.garage)),
    [db.vehicles],
  );
  const fuelings = useMemo(() => Object.values(db.fuelings).filter((f) => !f.deleted), [db.fuelings]);

  const addVehicle = (g) => {
    const garage = String(g).trim();
    if (!garage || vehicles.includes(garage)) return false;
    put("vehicles", { id: garage, garage, updated_at: nowISO(), deleted: false });
    return true;
  };
  const addFueling = (f) => {
    const t = nowISO();
    const rec = { id: uid(), ...f, garage: String(f.garage), created_at: t, updated_at: t, deleted: false, device_id: db.deviceId };
    put("fuelings", rec);
    return { rec, isNew: addVehicle(f.garage) };
  };
  const updateFueling = (id, patch) => {
    put("fuelings", { ...dbRef.current.fuelings[id], ...patch, updated_at: nowISO() });
    if (patch.garage) addVehicle(patch.garage);
  };
  const deleteFueling = (id) => put("fuelings", { ...dbRef.current.fuelings[id], deleted: true, updated_at: nowISO() });
  const saveTotalizer = (d, pumps) => put("totalizers", { id: d, date: d, pumps, updated_at: nowISO() });
  const setSetting = (k, v) => setDb((p) => ({ ...p, settings: { ...p.settings, [k]: v } }));

  const value = {
    db, date, setDate, online, syncing, pending, fuelings, vehicles,
    addVehicle, addFueling, updateFueling, deleteFueling, saveTotalizer, setSetting, sync,
  };
  return React.createElement(Ctx.Provider, { value }, children);
}
