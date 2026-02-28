import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { urls, clicks } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [url, clickRows] = await Promise.all([
    db
      .select({ slug: urls.slug, destination: urls.destination, created_at: urls.createdAt })
      .from(urls)
      .where(eq(urls.id, id))
      .then((r) => r[0] ?? null),

    db
      .select({ clickedAt: clicks.clickedAt, referer: clicks.referer, country: clicks.country, deviceType: clicks.deviceType })
      .from(clicks)
      .where(eq(clicks.urlId, id))
      .orderBy(asc(clicks.clickedAt)),
  ]);

  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clicksByDay: Record<string, number> = {};
  for (const c of clickRows) {
    const day = c.clickedAt.toISOString().slice(0, 10);
    clicksByDay[day] = (clicksByDay[day] ?? 0) + 1;
  }

  const chartData = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const date = d.toISOString().slice(0, 10);
    return { date, clicks: clicksByDay[date] ?? 0 };
  });

  const refCounts: Record<string, number> = {};
  for (const c of clickRows) {
    const ref = c.referer || "Direct";
    refCounts[ref] = (refCounts[ref] ?? 0) + 1;
  }
  const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const countryCounts: Record<string, number> = {};
  for (const c of clickRows) {
    const country = c.country || "Unknown";
    countryCounts[country] = (countryCounts[country] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const deviceCounts: Record<string, number> = {};
  for (const c of clickRows) {
    const device = c.deviceType || "Unknown";
    deviceCounts[device] = (deviceCounts[device] ?? 0) + 1;
  }
  const topDevices = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]);

  const todayKey = new Date().toISOString().slice(0, 10);

  return NextResponse.json({
    url,
    chartData,
    topReferrers,
    topCountries,
    totalClicks: clickRows.length,
    clicksToday: clicksByDay[todayKey] ?? 0,
    topDevices,
  });
}
