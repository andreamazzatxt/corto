import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAuthorizedUser } from "@/lib/guard";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";

export async function PATCH(req: Request) {
  const me = await getAuthorizedUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (me.role !== "superadmin") {
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
