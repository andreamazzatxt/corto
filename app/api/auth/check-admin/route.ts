import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

// Internal route called by middleware to verify admin status.
// Also updates last_login as a side effect.
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ authorized: false });

  const [user] = await db
    .select({ email: adminUsers.email })
    .from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.active, true)));

  if (!user) return NextResponse.json({ authorized: false });

  // fire-and-forget: update last_login
  db.update(adminUsers)
    .set({ lastLogin: new Date() })
    .where(eq(adminUsers.email, email))
    .catch(() => {});

  return NextResponse.json({ authorized: true });
}
