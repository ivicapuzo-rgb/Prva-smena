export const sumL = (arr) => arr.reduce((s, f) => s + (Number(f.liters) || 0), 0);
export const byDate = (arr, d) => arr.filter((f) => f.date === d);
export const inRange = (arr, from, to) => arr.filter((f) => f.date >= from && f.date <= to);
const key = (f) => `${f.date} ${f.time} ${f.created_at || ""}`;
export const sortDesc = (arr) => [...arr].sort((a, b) => key(b).localeCompare(key(a)));

export const pumpStats = (arr) => {
  const pumps = Array.from({ length: 8 }, (_, i) => ({ pump: i + 1, count: 0, liters: 0 }));
  arr.forEach((f) => {
    const p = pumps[f.pump - 1];
    if (p) {
      p.count += 1;
      p.liters += Number(f.liters) || 0;
    }
  });
  const max = Math.max(...pumps.map((p) => p.count));
  return { pumps, top: max > 0 ? pumps.filter((p) => p.count === max) : [] };
};

export const dayCounts = (arr, days) =>
  days.map((d) => {
    const l = byDate(arr, d);
    return { date: d, count: l.length, liters: sumL(l) };
  });

export const topDays = (counts, n = 3) =>
  counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count || a.date.localeCompare(b.date)).slice(0, n);
