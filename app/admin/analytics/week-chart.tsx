"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  type BarShapeProps,
} from "recharts";

const COLORS = [
  "oklch(0.703 0.181 54.0)",
  "oklch(0.60 0.15 200)",
  "oklch(0.63 0.18 280)",
  "oklch(0.65 0.18 140)",
  "oklch(0.62 0.20 30)",
  "oklch(0.68 0.15 240)",
  "oklch(0.68 0.17 100)",
  "oklch(0.60 0.19 320)",
  "oklch(0.74 0.13 60)",
  "oklch(0.63 0.14 170)",
];

interface Props {
  data: Record<string, string | number>[];
  slugs: string[];
}

// Returns a custom bar shape that applies top border-radius only when
// this segment is the topmost non-zero bar in the stack for that day.
function makeShape(slug: string, slugs: string[], data: Record<string, string | number>[], fill: string) {
  return function RoundedBar(props: BarShapeProps & { index?: number }) {
    const x = (props.x ?? 0) as number;
    const y = (props.y ?? 0) as number;
    const width = (props.width ?? 0) as number;
    const height = (props.height ?? 0) as number;
    const index = (props.index ?? 0) as number;

    if (!height || height < 1) return null;

    const myIdx = slugs.indexOf(slug);
    const isTop = slugs.slice(myIdx + 1).every((s) => Number(data[index]?.[s] ?? 0) === 0);

    if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={fill} />;

    const r = Math.min(4, width / 2, height);
    return (
      <path
        d={`M${x + r},${y} H${x + width - r} A${r},${r} 0 0 1 ${x + width},${y + r} V${y + height} H${x} V${y + r} A${r},${r} 0 0 1 ${x + r},${y}Z`}
        fill={fill}
      />
    );
  };
}

export function WeekChart({ data, slugs }: Props) {
  if (slugs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">Nessun click negli ultimi 7 giorni.</p>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    date: (d.date as string).slice(5),
  }));

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0 0% 90%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(0 0% 90%)", background: "#fff" }}
            cursor={{ fill: "hsl(0 0% 96%)" }}
          />
          {slugs.map((slug, i) => (
            <Bar
              key={slug}
              dataKey={slug}
              stackId="a"
              fill={COLORS[i % COLORS.length]}
              shape={makeShape(slug, slugs, data, COLORS[i % COLORS.length])}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
              animationBegin={i * 60}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {slugs.map((slug, i) => (
          <div key={slug} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-[11px] text-muted-foreground">/{slug}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
