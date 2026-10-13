import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";
  const res = await fetch(new URL("/api/auth/get-session", request.url), {
    headers: { cookie },
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await res.json().catch(() => null);

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const checkRes = await fetch(new URL("/api/auth/check-admin", request.url), {
    method: "POST",
    headers: { cookie },
  }).catch(() => null);

  if (!checkRes || !checkRes.ok) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  const { authorized } = await checkRes.json().catch(() => ({ authorized: false }));

  if (!authorized) {
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
