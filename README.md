# Corto

A self-hosted URL shortener with QR code generation and click analytics.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Better Auth · Drizzle ORM · Supabase (Postgres) · Cloudflare Workers + KV

**Tech:** Framer Motion · Radix UI · React Hook Form + Zod · TanStack Query & Virtual · Recharts · qr-code-styling · Sonner · Lucide React · date-fns

## Features

- Create and delete short links from a protected admin dashboard
- QR code generation with embedded logo
- Click analytics (country, referrer, user agent) with 7/30-day charts
- Google OAuth login with per-user access control
- Edge redirects via Cloudflare Worker (no DB hit on hot path)
- PWA-ready with push notifications

## Architecture

Two independent services:

**Next.js app** — admin dashboard only, deployed on Vercel (or any Node host)

**Cloudflare Worker** — handles all `slug → redirect` at edge, reads from KV, logs clicks to Supabase asynchronously

## Setup

### 1. Prerequisites

- [Bun](https://bun.sh)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm i -g wrangler`)
- A Supabase project
- A Cloudflare account
- A Google Cloud project with OAuth credentials

### 2. Database

Imposta `DATABASE_URL` in `.env.local` (vedi `.env.example`), poi applica le migrazioni:

```bash
bun run db:migrate
```

Le migrazioni Drizzle sono in `drizzle/` e definiscono le tabelle `urls`, `clicks`, `admin_users` e `push_subscriptions`. Dopo la prima migrazione, aggiungi il tuo utente admin dal dashboard (invito) o direttamente in DB:

```sql
insert into admin_users (email, role) values ('you@example.com', 'admin');
```

### 3. Cloudflare Worker

```bash
cd workers/redirect

# Create the KV namespace
wrangler kv:namespace create SLUGS
# → copy the returned id into wrangler.toml

# Add secrets to the worker
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# Deploy
wrangler deploy
# → note the *.workers.dev URL for NEXT_PUBLIC_SHORT_URL_BASE
```

### 4. Next.js app

```bash
# Install dependencies
bun install

# Copy and fill in environment variables
cp .env.example .env.local

# Run locally
bun run dev
```

### 5. Deploy (Vercel)

Push to GitHub and import the repo in Vercel. Add all environment variables from `.env.example` in the Vercel project settings.

## Environment variables

See [`.env.example`](.env.example) for the full list with descriptions.

## License

MIT
