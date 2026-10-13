import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { getAuthorizedUser } from "@/lib/guard";
import { adminUsers } from "@/lib/schema";

// Internal route called by the proxy to verify admin status of the current
// session (never of an arbitrary email). Also updates last_login as a side effect.
export async function POST() {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ authorized: false });

  // fire-and-forget: update last_login
  db.update(adminUsers)
    .set({ lastLogin: new Date() })
    .where(eq(adminUsers.email, user.email))
    .catch(() => {});

  return NextResponse.json({ authorized: true });
}
