import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/guard";
import { sendPushToAll } from "@/lib/webpush";

export async function POST(req: Request) {
  const user = await getAuthorizedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  await sendPushToAll({ title, body });

  return NextResponse.json({ ok: true });
}
