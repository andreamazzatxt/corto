import { NextResponse } from "next/server";
import { isNotNull, ne, sql } from "drizzle-orm";
import { getAuthorizedUser } from "@/lib/guard";
import { db } from "@/lib/db";
import { urls } from "@/lib/schema";

export async function GET() {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .selectDistinct({ group: urls.groupName })
    .from(urls)
    .where(isNotNull(urls.groupName) && ne(urls.groupName, ""))
    .orderBy(sql`${urls.groupName} asc`);

  return NextResponse.json(rows.map((r) => r.group).filter(Boolean));
}
