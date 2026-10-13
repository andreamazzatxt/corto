"use server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { urls, adminUsers } from "./schema";
import type { UserRole } from "./schema";
import { eq } from "drizzle-orm";
import { kvPut, kvDelete } from "./cloudflare";
import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "./guard";
import type { CreateUrlInput } from "./schemas";

async function requireUser() {
  const user = await getAuthorizedUser();
  if (!user) redirect("/login");
  return user;
}

function generateSlug(): string {
  return Math.random().toString(36).slice(2, 8);
}

function appendUtmParams(destination: string, data: CreateUrlInput): string {
  const url = new URL(destination);
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
  for (const field of utmFields) {
    const value = data[field]?.trim();
    if (value) url.searchParams.set(field, value);
  }
  return url.toString();
}

export async function createUrl(data: CreateUrlInput): Promise<{ slug: string }> {
  const user = await requireUser();
  const createdBy = user.email;

  const destination = appendUtmParams(data.destination, data);
  const slug = data.slug?.trim() || generateSlug();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const expiresRedirect = data.expires_redirect || null;

  const groupName = data.group?.trim() || null;

  const [row] = await db
    .insert(urls)
    .values({ slug, destination, expiresAt, expiresRedirect, createdBy, groupName })
    .returning({ id: urls.id });

  if (!row) throw new Error("Failed to insert URL");
  await kvPut(slug, { destination, id: row.id, expires_at: expiresAt?.toISOString() ?? null, expires_redirect: expiresRedirect });
  revalidatePath("/admin");
  return { slug };
}

export async function deleteUrl(id: string) {
  await requireUser();
  const [row] = await db.select({ slug: urls.slug }).from(urls).where(eq(urls.id, id));
  await db.delete(urls).where(eq(urls.id, id));
  if (row) await kvDelete(row.slug);
  revalidatePath("/admin");
}

export async function updateUrl(id: string, data: CreateUrlInput): Promise<void> {
  await requireUser();
  const destination = appendUtmParams(data.destination, data);
  const slug = data.slug?.trim() || generateSlug();
  const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  const expiresRedirect = data.expires_redirect || null;

  const groupName = data.group?.trim() || null;

  const [old] = await db.select({ slug: urls.slug }).from(urls).where(eq(urls.id, id));
  await db
    .update(urls)
    .set({ slug, destination, expiresAt, expiresRedirect, groupName })
    .where(eq(urls.id, id));

  if (old && old.slug !== slug) await kvDelete(old.slug);
  await kvPut(slug, { destination, id, expires_at: expiresAt?.toISOString() ?? null, expires_redirect: expiresRedirect });
  revalidatePath("/admin");
}

export async function addUser(email: string, role: UserRole = "user") {
  const me = await requireUser();
  if (me.role === "user") throw new Error("Non autorizzato");
  if (me.role === "admin" && role !== "user") throw new Error("Gli admin possono creare solo utenti");
  await db.insert(adminUsers).values({ email, active: true, role });
}

export async function toggleUser(email: string, active: boolean) {
  const me = await requireUser();
  if (me.email === email) throw new Error("Non puoi modificare il tuo stesso account");
  if (me.role === "user") throw new Error("Non autorizzato");

  const [target] = await db.select({ role: adminUsers.role }).from(adminUsers).where(eq(adminUsers.email, email));
  if (!target) throw new Error("Utente non trovato");
  if (me.role === "admin" && target.role !== "user") throw new Error("Non autorizzato");

  await db.update(adminUsers).set({ active }).where(eq(adminUsers.email, email));
}

export async function deleteUser(email: string) {
  const me = await requireUser();
  if (me.email === email) throw new Error("Non puoi eliminare il tuo stesso account");
  if (me.role !== "superadmin") throw new Error("Non autorizzato");
  await db.delete(adminUsers).where(eq(adminUsers.email, email));
}

export async function changeUserRole(email: string, role: UserRole) {
  const me = await requireUser();
  if (me.email === email) throw new Error("Non puoi cambiare il tuo stesso ruolo");
  if (me.role !== "superadmin") throw new Error("Non autorizzato");
  await db.update(adminUsers).set({ role }).where(eq(adminUsers.email, email));
}
