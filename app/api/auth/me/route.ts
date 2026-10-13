import { NextResponse } from "next/server";
import { getAuthorizedUser } from "@/lib/guard";

export async function GET() {
  const user = await getAuthorizedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(user);
}
