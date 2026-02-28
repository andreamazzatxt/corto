"use client";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { fetchJson } from "@/lib/fetch";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart2, Check, Copy, ExternalLink, Layers, LayoutList, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeleteLinkButton } from "@/components/delete-link-button";
import { QRCodeDialog } from "@/components/qr-code-dialog";
import { EditLinkDrawer } from "../edit-link-drawer";

type Url = {
  id: string;
  slug: string;
  destination: string;
  created_at: string;
  expires_at: string | null;
  expires_redirect: string | null;
  created_by: string | null;
  group_name: string | null;
  clicks: { count: number }[];
};

const shortUrlBase = process.env.NEXT_PUBLIC_SHORT_URL_BASE ?? "";
const shortUrlDisplay = shortUrlBase.replace(/^https?:\/\//, "");

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(url.replace(/^https?:\/\//, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Check size={16} className="text-green-500" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Copy size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

function UrlCard({ url, animate }: { url: Url; animate: boolean }) {
  const expired = url.expires_at && new Date(url.expires_at) < new Date();
  const clicks = url.clicks?.[0]?.count ?? 0;
  const [deleting, setDeleting] = useState(false);
  return (
    <motion.div initial={animate ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" as const }}>
      <Card className={`p-4 flex flex-col gap-2 transition-opacity${deleting ? " opacity-50 pointer-events-none select-none" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CopyButton url={`${shortUrlBase}/${url.slug}`} />
              <a href={`${shortUrlBase}/${url.slug}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                {shortUrlDisplay}/{url.slug}
              </a>
              {expired && <Badge variant="destructive">Scaduto</Badge>}
              {!expired && url.expires_at && (
                <Badge variant="secondary">
                  Scade {new Date(url.expires_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                </Badge>
              )}
            </div>
            <a href={url.destination} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground truncate hover:text-foreground transition-colors flex items-center gap-1">
              <span className="truncate">{url.destination}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <QRCodeDialog url={`${shortUrlBase}/${url.slug}`} slug={url.slug} />
            <EditLinkDrawer url={url} />
            <Link href={`/admin/${url.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <BarChart2 size={16} />
              </Button>
            </Link>
            <DeleteLinkButton id={url.id} onDeletingChange={setDeleting} />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{clicks} click</span>
          <div className="flex items-center gap-2">
            {url.created_by && (
              <span className="truncate max-w-[120px]" title={url.created_by}>
                {url.created_by.split("@")[0]}
              </span>
            )}
            <span>{new Date(url.created_at).toLocaleDateString("it-IT")}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function LinksPage() {
  const { data: urls } = useQuery<Url[]>({
    queryKey: ["urls"],
    queryFn: () => fetchJson<Url[]>("/api/urls"),
  });
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");

  // All distinct groups from loaded URLs
  const allGroups = [...new Set(urls?.map((u) => u.group_name).filter(Boolean) as string[])].sort();

  const sorted = urls
    ?.filter((url) => {
      const q = search.toLowerCase();
      const matchesSearch = url.slug.toLowerCase().includes(q) || url.destination.toLowerCase().includes(q);
      const matchesGroup = groupFilter === null || url.group_name === groupFilter;
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "clicks_desc": return (b.clicks?.[0]?.count ?? 0) - (a.clicks?.[0]?.count ?? 0);
        case "clicks_asc": return (a.clicks?.[0]?.count ?? 0) - (b.clicks?.[0]?.count ?? 0);
        case "slug": return a.slug.localeCompare(b.slug);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    }) ?? [];

  const seenIds = useRef(new Set<string>());
  const listRef = useRef<HTMLDivElement>(null);
  const virtualizer = useWindowVirtualizer({
    count: viewMode === "list" ? sorted.length : 0,
    estimateSize: () => 122,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  // Grouped view: group sorted URLs by group_name
  const grouped: { label: string; urls: Url[] }[] = [];
  if (viewMode === "grouped") {
    const map = new Map<string, Url[]>();
    for (const url of sorted) {
      const key = url.group_name ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(url);
    }
    // Named groups first (sorted), then ungrouped
    for (const g of [...map.keys()].filter(Boolean).sort()) {
      grouped.push({ label: g, urls: map.get(g)! });
    }
    if (map.has("")) grouped.push({ label: "Senza gruppo", urls: map.get("")! });
  }

  return (
    <motion.div
      className="px-4 pb-8 md:px-8 max-w-3xl mx-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="mb-3 pt-4 md:pt-8">
          <h1 className="text-2xl font-bold">Links</h1>
          <p className="text-sm text-muted-foreground">
            {urls === undefined ? "Caricamento…" : `${sorted.length} di ${urls.length} link`}
          </p>
        </div>

        {/* Group filter chips */}
        {allGroups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setGroupFilter(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${groupFilter === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              Tutti
            </button>
            {allGroups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupFilter(groupFilter === g ? null : g)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${groupFilter === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Search + sort + view toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input placeholder="Cerca per slug o URL…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="newest">Più recenti</option>
            <option value="oldest">Meno recenti</option>
            <option value="clicks_desc">Più click</option>
            <option value="clicks_asc">Meno click</option>
            <option value="slug">Slug A→Z</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setViewMode((v) => v === "list" ? "grouped" : "list")}
            title={viewMode === "list" ? "Vista raggruppata" : "Vista lista"}
          >
            {viewMode === "list" ? <Layers size={16} /> : <LayoutList size={16} />}
          </Button>
        </div>
      </div>

      {urls === undefined && (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 flex flex-col gap-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/4 mt-1" />
            </Card>
          ))}
        </div>
      )}

      {urls?.length === 0 && (
        <p className="text-center text-muted-foreground py-16">Nessun link ancora. Creane uno!</p>
      )}

      {urls && sorted.length === 0 && (search || groupFilter) && (
        <p className="text-center text-muted-foreground py-16">Nessun risultato.</p>
      )}

      {/* Flat list (virtualized) */}
      {viewMode === "list" && (
        <div ref={listRef} style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((item) => (
            <div
              key={sorted[item.index].id}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`, paddingBottom: "12px" }}
            >
              {(() => {
                const url = sorted[item.index];
                const isNew = !seenIds.current.has(url.id);
                if (isNew) seenIds.current.add(url.id);
                return <UrlCard url={url} animate={isNew} />;
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Grouped view */}
      {viewMode === "grouped" && (
        <div ref={listRef} className="flex flex-col gap-6">
          {grouped.map(({ label, urls: groupUrls }) => (
            <div key={label}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{label}</h2>
              <div className="flex flex-col gap-3">
                {groupUrls.map((url) => {
                  const isNew = !seenIds.current.has(url.id);
                  if (isNew) seenIds.current.add(url.id);
                  return <UrlCard key={url.id} url={url} animate={isNew} />;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
