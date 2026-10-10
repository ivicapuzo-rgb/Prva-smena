const pad = (n) => String(n).padStart(2, "0");
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISO(new Date());
export const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (s, n) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const fmtDate = (s) => {
  const [y, m, d] = s.split("-");
  return `${d}.${m}.${y}.`;
};
export const fmtShort = (s) => {
  const [, m, d] = s.split("-");
  return `${d}.${m}.`;
};
export const weekStart = (s) => {
  const d = parseISO(s);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return toISO(d);
};
export const range = (from, to) => {
  const out = [];
  for (let c = from; c <= to; c = addDays(c, 1)) out.push(c);
  return out;
};
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const DAYS = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
export const dayName = (s) => DAYS[parseISO(s).getDay()];
export const fmtL = (n) => (Number(n) || 0).toFixed(2).replace(".", ",");
export const fmtTot = (n) =>
  n == null || Number.isNaN(n) ? "" : Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
export const parseNum = (s) => {
  if (s === "" || s == null) return null;
  const n = parseFloat(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
};
