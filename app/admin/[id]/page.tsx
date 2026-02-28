"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { fetchJson } from "@/lib/fetch";
import Link from "next/link";
import { ArrowLeft, MousePointerClick, Globe, ExternalLink, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/count-up";
import { ClicksChart } from "./clicks-chart";

type AnalyticsData = {
  url: { slug: string; destination: string; created_at: string };
  chartData: { date: string; clicks: number }[];
  topReferrers: [string, number][];
  topCountries: [string, number][];
  topDevices: [string, number][];
  totalClicks: number;
  clicksToday: number;
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  const { data } = useQuery<AnalyticsData>({
    queryKey: ["analytics", id],
    queryFn: () => fetchJson<AnalyticsData>(`/api/analytics/${id}`),
    enabled: !!id,
  });

  return (
    <motion.div
      className="p-4 md:p-8 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} /> Links
      </Link>

      <div className="mb-6">
        {data ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <h1 className="text-2xl font-bold text-primary">/{data.url.slug}</h1>
            <a
              href={data.url.destination}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <span className="truncate max-w-xs">{data.url.destination}</span>
              <ExternalLink size={12} />
            </a>
          </motion.div>
        ) : (
          <div className="animate-pulse">
            <div className="h-7 bg-muted rounded w-32 mb-2" />
            <div className="h-4 bg-muted rounded w-64" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { icon: <MousePointerClick size={15} />, label: "Click totali", value: data?.totalClicks },
          { icon: <MousePointerClick size={15} />, label: "Oggi", value: data?.clicksToday },
        ].map(({ icon, label, value }, i) => (
          <motion.div key={label} custom={i} variants={cardVariants} initial="hidden" animate="show">
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                {icon} {label}
              </div>
              <p className="text-3xl font-bold">
                {value === undefined ? (
                  <span className="block h-9 w-12 bg-muted rounded animate-pulse" />
                ) : (
                  <CountUp value={value} />
                )}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div custom={2} variants={cardVariants} initial="hidden" animate="show">
        <Card className="p-4 mb-6">
          <p className="text-sm font-medium mb-4">Click — ultimi 30 giorni</p>
          {data ? (
            <ClicksChart data={data.chartData} />
          ) : (
            <div className="h-32 bg-muted rounded animate-pulse" />
          )}
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {[
          {
            icon: <ExternalLink size={14} />,
            label: "Top referrer",
            items: data?.topReferrers,
            keyFn: ([ref]: [string, number]) => ref,
            labelFn: ([ref]: [string, number]) => ref,
            countFn: ([, c]: [string, number]) => c,
          },
          {
            icon: <Globe size={14} />,
            label: "Top paesi",
            items: data?.topCountries,
            keyFn: ([c]: [string, number]) => c,
            labelFn: ([c]: [string, number]) => c,
            countFn: ([, c]: [string, number]) => c,
          },
        ].map(({ icon, label, items, keyFn, labelFn, countFn }, i) => (
          <motion.div key={label} custom={3 + i} variants={cardVariants} initial="hidden" animate="show">
            <Card className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                {icon} {label}
              </p>
              {!items ? (
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-4 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessun dato</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((item, j) => (
                    <motion.div
                      key={keyFn(item)}
                      className="flex items-center justify-between text-sm"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + j * 0.06, duration: 0.25, ease: "easeOut" }}
                    >
                      <span className="truncate text-muted-foreground max-w-[180px]">{labelFn(item)}</span>
                      <span className="font-medium tabular-nums">{countFn(item)}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div custom={5} variants={cardVariants} initial="hidden" animate="show">
        <Card className="p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <Smartphone size={14} /> Dispositivi
          </p>
          {!data?.topDevices ? (
            <div className="flex flex-col gap-2">
              {[...Array(2)].map((_, j) => (
                <div key={j} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : data.topDevices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun dato</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.topDevices.map(([device, count], j) => (
                <motion.div
                  key={device}
                  className="flex items-center justify-between text-sm"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + j * 0.06, duration: 0.25, ease: "easeOut" }}
                >
                  <span className="capitalize text-muted-foreground">{device}</span>
                  <span className="font-medium tabular-nums">{count}</span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
