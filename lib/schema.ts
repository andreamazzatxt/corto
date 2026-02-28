import { pgTable, uuid, text, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";

export const urls = pgTable("urls", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").unique().notNull(),
  destination: text("destination").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  expiresRedirect: text("expires_redirect"),
  createdBy: text("created_by"),
  groupName: text("group_name"),
});

export const clicks = pgTable("clicks", {
  id: uuid("id").primaryKey().defaultRandom(),
  urlId: uuid("url_id").references(() => urls.id, { onDelete: "cascade" }).notNull(),
  clickedAt: timestamp("clicked_at", { withTimezone: true }).defaultNow().notNull(),
  userAgent: text("user_agent"),
  referer: text("referer"),
  country: text("country"),
  deviceType: text("device_type"),
}, (t) => [
  index("clicks_url_id_idx").on(t.urlId),
  index("clicks_clicked_at_idx").on(t.clickedAt),
]);

export type UserRole = "superadmin" | "admin" | "user";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userEmail: text("user_email").notNull().unique(),
  subscription: jsonb("subscription").notNull(),
  muted: boolean("muted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  email: text("email").primaryKey(),
  active: boolean("active").default(true).notNull(),
  role: text("role").$type<UserRole>().default("user").notNull(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
});
