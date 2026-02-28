function getDeviceType(ua: string | null): string {
  if (!ua) return "unknown";
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  // cspell:disable-next-line
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) return "mobile";
  return "desktop";
}

interface CfRequest extends Request {
  cf?: { country?: string };
}

interface Env {
  SLUGS: KVNamespace;
  APP_URL: string;
  EXTERNAL_API_SECRET: string;
}

export default {
  async fetch(request: CfRequest, env: Env, ctx: ExecutionContext): Promise<Response> {
    const slug = new URL(request.url).pathname.slice(1);
    if (!slug) return new Response("Not found", { status: 404 });

    const value = await env.SLUGS.get(slug);
    if (!value) return new Response("Not found", { status: 404 });

    const { destination, id, expires_at, expires_redirect } = JSON.parse(value) as { destination: string; id: string; expires_at: string | null; expires_redirect: string | null };

    if (expires_at && new Date(expires_at) < new Date()) {
      return expires_redirect
        ? Response.redirect(expires_redirect, 302)
        : new Response("Gone", { status: 410 });
    }

    ctx.waitUntil(
      fetch(`${env.APP_URL}/api/clicks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-clicks-secret": env.EXTERNAL_API_SECRET,
        },
        body: JSON.stringify({
          url_id: id,
          user_agent: request.headers.get("user-agent"),
          referer: request.headers.get("referer"),
          country: request.cf?.country ?? null,
          device_type: getDeviceType(request.headers.get("user-agent")),
        }),
      })
    );

    return Response.redirect(destination, 302);
  },
};
