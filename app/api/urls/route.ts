import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { urls, clicks } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: urls.id,
      slug: urls.slug,
      destination: urls.destination,
      created_at: urls.createdAt,
      expires_at: urls.expiresAt,
      expires_redirect: urls.expiresRedirect,
      created_by: urls.createdBy,
      group_name: urls.groupName,
      clicks: sql<{ count: number }[]>`json_build_array(json_build_object('count', count(${clicks.id})))`,
    })
    .from(urls)
    .leftJoin(clicks, sql`${clicks.urlId} = ${urls.id}`)
    .groupBy(urls.id)
    .orderBy(sql`${urls.createdAt} desc`);

  return NextResponse.json(rows);
}
