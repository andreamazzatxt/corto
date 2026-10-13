import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAuthorizedUser } from "@/lib/guard";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";

async function getEmail(): Promise<string | null> {
  return (await getAuthorizedUser())?.email ?? null;
}

export async function POST(req: Request) {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();

  await db
    .insert(pushSubscriptions)
    .values({ userEmail: email, subscription })
    .onConflictDoUpdate({
      target: pushSubscriptions.userEmail,
      set: { subscription },
    });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const email = await getEmail();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userEmail, email));

  return NextResponse.json({ ok: true });
}
