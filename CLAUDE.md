# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # start Next.js dev server (localhost:3000)
bun run build    # production build
bun run lint     # ESLint

# Cloudflare Worker (from workers/redirect/)
wrangler dev     # local worker dev
wrangler deploy  # deploy to workers.dev
```

## Architecture

Corto is a URL shortener with two independent services:

**1. Next.js app** (`app/`, `lib/`) — admin dashboard only
- `/` redirects to `/admin`
- `/login` — Google OAuth via Better Auth
- `/admin` — protected dashboard: create/delete URLs, view click counts
- `middleware.ts` protects `/admin/*` by verifying the Better Auth session and checking `ALLOWED_EMAILS`

**2. Cloudflare Worker** (`workers/redirect/`) — handles all redirects at edge
- Reads `slug → { destination, id }` from Cloudflare KV (`SLUGS` binding), no DB hit on hot path
- Logs click analytics (user_agent, referer, country) to Supabase `clicks` table via `ctx.waitUntil`
- Deployed separately; `NEXT_PUBLIC_SHORT_URL_BASE` points the admin UI at its URL

**Data flow for URL creation:**
`createUrl` server action → insert into Supabase `urls` → `kvPut` via Cloudflare REST API

**Data flow for a redirect:**
request → Worker → KV lookup → `ctx.waitUntil(Supabase clicks insert)` → 302 redirect

## Key files

| File | Role |
|------|------|
| `lib/auth.ts` | Better Auth config — Google OAuth, stateless sessions (no `database` key = encrypted cookie sessions) |
| `lib/supabase.ts` | Supabase service-role client |
| `lib/actions.ts` | `createUrl` / `deleteUrl` — write to Supabase and sync KV |
| `lib/cloudflare.ts` | `kvPut` / `kvDelete` — Cloudflare KV REST API helpers |
| `middleware.ts` | Session guard: fetches `/api/auth/get-session`, checks email against `admin_users` table (`active = true`), updates `last_login` |
| `workers/redirect/src/index.ts` | Cloudflare Worker — KV lookup, redirect, async click logging |

## Supabase schema

```sql
-- urls
id uuid PK, slug text UNIQUE, destination text, created_at timestamptz

-- clicks (per-click analytics, no counter column on urls)
id uuid PK, url_id uuid FK→urls(id), clicked_at timestamptz, user_agent text, referer text, country text

-- admin_users (authorization — checked by middleware)
email text PK, active boolean DEFAULT true, last_login timestamptz
```

Admin page queries: `.select("*, clicks(count)")` — click count is `url.clicks?.[0]?.count`.

## Environment variables

```
BETTER_AUTH_SECRET, BETTER_AUTH_URL
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_KV_NAMESPACE_ID
NEXT_PUBLIC_SHORT_URL_BASE            # https://your-worker.your-subdomain.workers.dev
```

## Gotchas

- Next.js 15: `searchParams` in page components is `Promise<{…}>` — must be awaited
- Client components cannot be async — extract interactive parts into `"use client"` children
- Better Auth stateless mode: omitting `database` from the config stores sessions in encrypted cookies; sessions survive server restarts with no extra setup
