import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers, pushSubscriptions } from "@/lib/schema";

export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [me] = await db.select().from(adminUsers).where(eq(adminUsers.email, session.user.email));
  if (me?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, muted } = await req.json();
  if (!email || typeof muted !== "boolean") {
    return NextResponse.json({ error: "email and muted required" }, { status: 400 });
  }

  await db
    .update(pushSubscriptions)
    .set({ muted })
    .where(eq(pushSubscriptions.userEmail, email));

  return NextResponse.json({ ok: true });
}
