import { NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { clicks, urls } from "@/lib/schema";
import { sendPushToAll } from "@/lib/webpush";

const MILESTONES = [10, 50, 100, 500, 1000, 5000, 10000];

export async function POST(req: Request) {
  const secret = req.headers.get("x-clicks-secret");
  if (!secret || secret !== process.env.EXTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { url_id, user_agent, referer, country, device_type } = await req.json();
  if (!url_id) return NextResponse.json({ error: "url_id required" }, { status: 400 });

  await db.insert(clicks).values({ urlId: url_id, userAgent: user_agent, referer, country, deviceType: device_type });

  // Milestone check (fire-and-forget)
  checkMilestone(url_id).catch(() => {});

  return NextResponse.json({ ok: true });
}

async function checkMilestone(urlId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(clicks)
    .where(eq(clicks.urlId, urlId));

  if (!MILESTONES.includes(Number(total))) return;

  const [url] = await db.select({ slug: urls.slug }).from(urls).where(eq(urls.id, urlId));
  if (!url) return;

  await sendPushToAll({
    title: "🔥 Milestone raggiunta!",
    body: `/${url.slug} ha raggiunto ${total} click`,
    url: `${process.env.BETTER_AUTH_URL}/admin/${urlId}`,
  });
}
