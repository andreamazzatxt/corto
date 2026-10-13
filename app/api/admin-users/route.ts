import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getAuthorizedUser } from "@/lib/guard";
import { db } from "@/lib/db";
import { adminUsers, pushSubscriptions } from "@/lib/schema";

export async function GET() {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db
    .select({
      email: adminUsers.email,
      active: adminUsers.active,
      role: adminUsers.role,
      last_login: adminUsers.lastLogin,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.email));

  const subs = await db
    .select({ userEmail: pushSubscriptions.userEmail, muted: pushSubscriptions.muted })
    .from(pushSubscriptions);

  const subMap = new Map(subs.map((s) => [s.userEmail, s.muted]));

  const data = users.map((u) => ({
    ...u,
    subscribed: subMap.has(u.email),
    notifMuted: subMap.get(u.email) ?? false,
  }));

  return NextResponse.json(data);
}
