import { NextResponse } from "next/server";

export function GET() {
  const v =
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    null;
  return NextResponse.json({ v }, { headers: { "Cache-Control": "no-store" } });
}
