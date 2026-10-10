import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, LabelList } from "recharts";

export const MiniBars = ({ data, xKey, highlight, testId, height = 170 }) => (
  <div style={{ height }} data-testid={testId}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 18, right: 0, left: -28, bottom: 0 }}>
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} interval={0}
          tick={{ fontFamily: "Barlow Condensed", fontSize: 11, fill: "#555" }} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#aaa" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive>
          {data.map((d, i) => <Cell key={i} fill={highlight(d) ? "#e10600" : "#f5a623"} />)}
          <LabelList dataKey="count" position="top" style={{ fontFamily: "Barlow Condensed", fontSize: 12, fontWeight: 700 }}
            formatter={(v) => (v ? v : "")} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);
