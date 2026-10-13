import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { adminUsers } from "./schema";
import type { UserRole } from "./schema";

export type AuthorizedUser = { email: string; role: UserRole };

// Any Google account can sign in, so a session alone proves nothing: access
// requires an active row in admin_users. Every server action and API route
// goes through this, not just the /admin pages guarded by the proxy.
export async function getAuthorizedUser(): Promise<AuthorizedUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email;
  if (!email) return null;

  const [user] = await db
    .select({ email: adminUsers.email, role: adminUsers.role })
    .from(adminUsers)
    .where(and(eq(adminUsers.email, email), eq(adminUsers.active, true)));

  return user ?? null;
}
