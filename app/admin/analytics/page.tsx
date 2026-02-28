"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchJson } from "@/lib/fetch";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, TrendingUp, Link2, Layers, LayoutList } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { WeekChart } from "./week-chart";
import { useState } from "react";

type OverviewData = {
  urls: { id: string; slug: string; destination: string; group_name: string | null; clicks: { count: number }[] }[];
  totalClicks: number;
  weekClicks: number;
  weekChart: { data: Record<string, string | number>[]; slugs: string[] };
  groupChart: { data: Record<string, string | number>[]; slugs: string[] };
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function AnalyticsOverviewPage() {
  const [viewMode, setViewMode] = useState<"link" | "group">("link");
  const [days, setDays] = useState<7 | 30>(7);

  const { data } = useQuery<OverviewData>({
    queryKey: ["analytics", days],
    queryFn: () => fetchJson<OverviewData>(`/api/analytics?days=${days}`),
  });

  const sortedLinks = [...(data?.urls ?? [])].sort(
    (a, b) => (b.clicks?.[0]?.count ?? 0) - (a.clicks?.[0]?.count ?? 0)
  );

  // Aggregate clicks by group client-side
  const groupMap = new Map<string, number>();
  for (const url of data?.urls ?? []) {
    const key = url.group_name ?? "Senza gruppo";
    groupMap.set(key, (groupMap.get(key) ?? 0) + (url.clicks?.[0]?.count ?? 0));
  }
  const sortedGroups = [...groupMap.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <motion.div
      className="p-4 md:p-8 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Panoramica di tutti i link</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: <MousePointerClick size={13} />, label: "Totali", value: data?.totalClicks },
          { icon: <TrendingUp size={13} />, label: "Settimana", value: data?.weekClicks },
          { icon: <Link2 size={13} />, label: "Link attivi", value: data?.urls.length },
        ].map(({ icon, label, value }, i) => (
          <motion.div key={label} custom={i} variants={cardVariants} initial="hidden" animate="show">
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                {icon} {label}
              </div>
              <p className="text-2xl font-bold">
                {value === undefined ? (
                  <span className="block h-7 w-8 bg-muted rounded animate-pulse" />
                ) : (
                  <CountUp value={value} />
                )}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div custom={3} variants={cardVariants} initial="hidden" animate="show">
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <p className="text-sm font-medium">
              {viewMode === "link" ? "Click per link" : "Click per gruppo"} — ultimi {days} giorni
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {([7, 30] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${days === d ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {d}g
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("link")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "link" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutList size={12} /> Link
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("group")}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "group" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Layers size={12} /> Gruppo
                </button>
              </div>
            </div>
          </div>
          {data ? (
            <WeekChart
              key={viewMode}
              data={viewMode === "link" ? data.weekChart.data : data.groupChart.data}
              slugs={viewMode === "link" ? data.weekChart.slugs : data.groupChart.slugs}
            />
          ) : (
            <div className="h-[240px] bg-muted rounded animate-pulse" />
          )}
        </Card>
      </motion.div>

      <div className="flex flex-col gap-2">
        {viewMode === "link" ? (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Link per click</p>

            {data === undefined &&
              [...Array(4)].map((_, i) => (
                <Card key={i} className="p-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-5 bg-muted rounded w-16" />
                  </div>
                </Card>
              ))}

            {sortedLinks.map((url, i) => {
              const clicks = url.clicks?.[0]?.count ?? 0;
              return (
                <motion.div key={url.id} custom={i} variants={cardVariants} initial="hidden" animate="show">
                  <Link href={`/admin/${url.id}`}>
                    <Card className="p-3 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-sm text-primary shrink-0">/{url.slug}</span>
                          <span className="text-xs text-muted-foreground truncate">{url.destination}</span>
                        </div>
                        <Badge variant="secondary" className="shrink-0 tabular-nums">{clicks} click</Badge>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Gruppi per click</p>

            {data === undefined &&
              [...Array(3)].map((_, i) => (
                <Card key={i} className="p-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-5 bg-muted rounded w-16" />
                  </div>
                </Card>
              ))}

            {sortedGroups.map(([group, total], i) => (
              <motion.div key={group} custom={i} variants={cardVariants} initial="hidden" animate="show">
                <Card className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">{group}</span>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">{total} click</Badge>
                  </div>
                </Card>
              </motion.div>
            ))}
          </>
        )}

        {data?.urls.length === 0 && (
          <p className="text-center text-muted-foreground py-12">Nessun link ancora.</p>
        )}
      </div>
    </motion.div>
  );
}
