import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/guard";
import { db } from "@/lib/db";
import { urls, clicks } from "@/lib/schema";
import { sql, gte } from "drizzle-orm";

export async function GET(request: Request) {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days") === "30" ? 30 : 7;

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (days - 1));
  rangeStart.setHours(0, 0, 0, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [urlRows, [{ totalClicks }], [{ weekClicks }], recentClicks] = await Promise.all([
    db
      .select({
        id: urls.id,
        slug: urls.slug,
        destination: urls.destination,
        group_name: urls.groupName,
        created_at: urls.createdAt,
        clicks: sql<{ count: number }[]>`json_build_array(json_build_object('count', count(${clicks.id})))`,
      })
      .from(urls)
      .leftJoin(clicks, sql`${clicks.urlId} = ${urls.id}`)
      .groupBy(urls.id)
      .orderBy(sql`${urls.createdAt} desc`),

    db.select({ totalClicks: sql<number>`count(*)` }).from(clicks),

    db.select({ weekClicks: sql<number>`count(*)` }).from(clicks).where(gte(clicks.clickedAt, weekAgo)),

    db
      .select({ clickedAt: clicks.clickedAt, urlId: clicks.urlId, slug: urls.slug, groupName: urls.groupName })
      .from(clicks)
      .innerJoin(urls, sql`${urls.id} = ${clicks.urlId}`)
      .where(gte(clicks.clickedAt, rangeStart)),
  ]);

  const allDays = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  const dayIndex: Record<string, number> = {};
  allDays.forEach((d, i) => { dayIndex[d] = i; });

  // --- Link chart (top 10 by range clicks) ---
  const clicksPerUrl: Record<string, number> = {};
  const slugMap: Record<string, string> = {};
  for (const c of recentClicks) {
    if (!c.slug) continue;
    clicksPerUrl[c.urlId] = (clicksPerUrl[c.urlId] ?? 0) + 1;
    slugMap[c.urlId] = c.slug;
  }
  const top10Slugs = Object.entries(clicksPerUrl)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => slugMap[id]);

  const linkChartData: Record<string, string | number>[] = allDays.map((date) => {
    const entry: Record<string, string | number> = { date };
    for (const slug of top10Slugs) entry[slug] = 0;
    return entry;
  });
  for (const c of recentClicks) {
    const day = c.clickedAt.toISOString().slice(0, 10);
    if (!c.slug || dayIndex[day] === undefined || !top10Slugs.includes(c.slug)) continue;
    (linkChartData[dayIndex[day]][c.slug] as number) += 1;
  }

  // --- Group chart ---
  const clicksPerGroup: Record<string, number> = {};
  for (const c of recentClicks) {
    const key = c.groupName ?? "Senza gruppo";
    clicksPerGroup[key] = (clicksPerGroup[key] ?? 0) + 1;
  }
  const topGroups = Object.entries(clicksPerGroup)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const groupChartData: Record<string, string | number>[] = allDays.map((date) => {
    const entry: Record<string, string | number> = { date };
    for (const g of topGroups) entry[g] = 0;
    return entry;
  });
  for (const c of recentClicks) {
    const day = c.clickedAt.toISOString().slice(0, 10);
    const key = c.groupName ?? "Senza gruppo";
    if (dayIndex[day] === undefined) continue;
    (groupChartData[dayIndex[day]][key] as number) += 1;
  }

  return NextResponse.json({
    urls: urlRows,
    totalClicks: Number(totalClicks),
    weekClicks: Number(weekClicks),
    weekChart: { data: linkChartData, slugs: top10Slugs },
    groupChart: { data: groupChartData, slugs: topGroups },
  });
}
