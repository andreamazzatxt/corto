import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/schema";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "",
  process.env.VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToAll(payload: PushPayload) {
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.muted, false));
  await Promise.allSettled(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(
          row.subscription as webpush.PushSubscription,
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
        }
      }
    }),
  );
}
