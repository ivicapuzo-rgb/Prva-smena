import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Lock, FileDown, Share2, RefreshCw } from "lucide-react";
import { API, mergeVehicles, useStore } from "@/lib/store";
import { fmtDate, fmtL, dayName } from "@/lib/dates";
import { byDate, sumL } from "@/lib/stats";
import { periodPdf, qfPdf } from "@/lib/pdf";
import { usePdf } from "@/lib/usePdf";
import { Card, inputCls } from "@/components/ui-kit";

const TK = "ps_admin_token";

const Login = ({ onToken }) => {
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      if (!r.ok) throw new Error();
      const { token } = await r.json();
      sessionStorage.setItem(TK, token);
      onToken(token);
    } catch {
      toast.error(navigator.onLine ? "Pogrešna lozinka" : "Admin panel zahteva internet");
    } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} className="mt-10 space-y-4" data-testid="admin-login-form">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-black text-[var(--ps-amber)]"><Lock className="h-8 w-8" /></div>
      <h2 className="font-display text-4xl uppercase">Prijava</h2>
      <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Lozinka" className={inputCls} data-testid="admin-password-input" autoFocus />
      <button disabled={loading} data-testid="admin-login-button" className="press h-14 w-full rounded-2xl bg-[var(--ps-red)] font-display text-xl uppercase text-white disabled:opacity-60">
        {loading ? "Provera…" : "Uđi"}
      </button>
    </form>
  );
};

const DayRow = ({ d, data, vehicles, signature, pdf }) => {
  const list = byDate(data.fuelings, d);
  const tot = data.totalizers.find((t) => t.date === d);
  const qf = () => qfPdf({ date: d, fuelings: data.fuelings, totalizer: tot, vehicles, signature });
  const day = () => periodPdf({ from: d, to: d, fuelings: data.fuelings });
  const btn = "press flex h-10 items-center justify-center gap-1.5 rounded-xl font-cond text-sm font-semibold disabled:opacity-50";
  return (
    <li className="rounded-2xl border border-neutral-200 p-4" data-testid={`admin-day-${d}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-digits text-base">{fmtDate(d)}</span>
        <span className="font-cond text-sm text-neutral-500">{dayName(d)}</span>
      </div>
      <p className="mt-1 font-cond text-base">
        <b>{list.length}</b> vozila · <b>{fmtL(sumL(list))}</b> L · totalizatori: {tot ? <span className="text-[var(--ps-green)]">uneti</span> : <span className="text-neutral-400">nisu uneti</span>}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button disabled={!!pdf.busy} onClick={() => pdf.run(`q${d}`, qf, false)} className={`${btn} bg-[var(--ps-blue)] text-white`} data-testid={`admin-qf-${d}`}><FileDown className="h-4 w-4" />QF-E-003</button>
        <button disabled={!!pdf.busy} onClick={() => pdf.run(`d${d}`, day, false)} className={`${btn} border border-black`} data-testid={`admin-daily-${d}`}><FileDown className="h-4 w-4" />Dnevni</button>
        <button disabled={!!pdf.busy} onClick={() => pdf.run(`s${d}`, qf, true)} className={`${btn} border border-black`} data-testid={`admin-share-${d}`}><Share2 className="h-4 w-4" />Podeli</button>
      </div>
    </li>
  );
};

const Panel = ({ token, onLogout }) => {
  const { db } = useStore();
  const [data, setData] = useState(null);
  const pdf = usePdf();
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/admin/data`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.status === 401) return onLogout();
      const j = await r.json();
      setData({ ...j, fuelings: j.fuelings.filter((f) => !f.deleted) });
    } catch { toast.error("Nije moguće učitati podatke – proverite internet"); }
    return undefined;
  }, [token, onLogout]);
  useEffect(() => { load(); }, [load]);

  const vehicles = useMemo(() => (data ? mergeVehicles(data.vehicles.filter((v) => !v.deleted).map((v) => v.garage)) : []), [data]);
  const days = useMemo(() => (data ? [...new Set([...data.fuelings.map((f) => f.date), ...data.totalizers.map((t) => t.date)])].sort().reverse() : []), [data]);

  if (!data) return <p className="mt-10 font-cond text-lg text-neutral-500">Učitavanje…</p>;
  return (
    <div className="mt-6 space-y-5" data-testid="admin-panel">
      <div className="grid grid-cols-3 gap-2">
        {[["Dana", days.length], ["Vozila", data.fuelings.length], ["Litara", fmtL(sumL(data.fuelings))]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-black p-3 text-white"><span className="block font-cond text-xs uppercase text-neutral-400">{l}</span><span className="font-display text-2xl" data-testid={`admin-stat-${l.toLowerCase()}`}>{v}</span></div>
        ))}
      </div>
      <button onClick={load} className="press flex items-center gap-2 font-cond text-sm font-semibold text-[var(--ps-blue)]" data-testid="admin-refresh-button"><RefreshCw className="h-4 w-4" /> Osveži</button>
      <Card>
        <h2 className="mb-3 font-cond text-xl font-semibold">Svi izveštaji po danima</h2>
        {days.length ? <ul className="space-y-3">{days.map((d) => <DayRow key={d} d={d} data={data} vehicles={vehicles} signature={db.settings.signature} pdf={pdf} />)}</ul>
          : <p className="font-cond text-neutral-400" data-testid="admin-empty">Još nema podataka na serveru.</p>}
      </Card>
    </div>
  );
};

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TK));
  const logout = useCallback(() => { sessionStorage.removeItem(TK); setToken(null); }, []);
  return (
    <div className="px-4 pb-10 pt-6" data-testid="admin-page">
      <div className="flex items-center justify-between">
        <Link to="/" className="press inline-flex items-center gap-1 font-cond text-base font-semibold" data-testid="admin-back-link"><ArrowLeft className="h-5 w-5" /> Nazad</Link>
        {token && <button onClick={logout} className="press inline-flex items-center gap-1 font-cond text-base font-semibold text-[var(--ps-red)]" data-testid="admin-logout-button"><LogOut className="h-4 w-4" /> Odjava</button>}
      </div>
      <h1 className="mt-4 font-display text-6xl uppercase leading-none">Admin panel</h1>
      {token ? <Panel token={token} onLogout={logout} /> : <Login onToken={setToken} />}
    </div>
  );
}
