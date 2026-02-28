"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface Props {
  data: { date: string; clicks: number }[];
}

export function ClicksChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.clicks), 1);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 90%)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => v.slice(5)}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(0 0% 90%)", background: "#fff" }}
          labelFormatter={(v) => `Data: ${v}`}
          cursor={{ fill: "hsl(0 0% 96%)", radius: 4 }}
        />
        <Bar
          dataKey="clicks"
          radius={[4, 4, 0, 0]}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
          animationBegin={100}
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.clicks === max && max > 0
                  ? "oklch(0.703 0.181 54.0)"
                  : "oklch(0.703 0.181 54.0 / 0.45)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
