import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendPushToAll } from "@/lib/webpush";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, session.user.email));

  if (user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  await sendPushToAll({ title, body });

  return NextResponse.json({ ok: true });
}
