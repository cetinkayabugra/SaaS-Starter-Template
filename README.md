# SaaS Starter

A full-stack SaaS starter kit with authentication and subscription billing already wired up, so you can focus on your product instead of re-building auth and payments.

## Stack

- **Framework**: Next.js (App Router) — Route Handlers and Server Actions as the backend, no separate API server
- **Database**: PostgreSQL via [Prisma](https://www.prisma.io/)
- **Auth**: [Auth.js v5](https://authjs.dev/) — email/password (credentials) + Google OAuth
- **Billing**: [Stripe](https://stripe.com/) — recurring subscriptions, Checkout, and the Customer Portal
- **UI**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
- **Package manager**: pnpm

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/installation)
- A PostgreSQL database — either:
  - Local, via [Docker](https://www.docker.com/products/docker-desktop/) (`docker-compose.yml` is included), or
  - A free hosted instance, e.g. [Neon](https://neon.tech) or [Supabase](https://supabase.com)
- A [Stripe](https://dashboard.stripe.com/register) account (test mode is fine)
- A [Google Cloud](https://console.cloud.google.com/) project, if you want Google sign-in

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then fill in `.env` — see [Environment variables](#environment-variables) below for where to get each value.

### 3. Set up the database

**Option A — local Postgres via Docker:**

```bash
docker compose up -d
```

This matches the default `DATABASE_URL` in `.env.example`.

**Option B — hosted Postgres (Neon/Supabase/etc.):** create a database and put its connection string in `DATABASE_URL` instead. Use the *direct* (non-pooled) connection string for running migrations — pooled/PgBouncer connections can break Prisma's migration engine.

Then apply the schema:

```bash
pnpm prisma migrate dev --name init
```

### 4. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Forward Stripe webhooks locally

Subscription status only syncs to the database when Stripe's webhook fires. Locally, that means running the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

It prints a `whsec_...` value — put that in `STRIPE_WEBHOOK_SECRET` in `.env` (it changes each time you start `stripe listen`, so update it whenever you restart the CLI).

## Environment variables

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | Your local Docker Postgres, or your Neon/Supabase project's connection string |
| `NEXTAUTH_SECRET` | Secret used to sign session tokens | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the app | `http://localhost:3000` in dev |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (optional — omit to disable Google sign-in) | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth client ID (Web application). Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI |
| `STRIPE_SECRET_KEY` | Stripe secret API key | [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys) → Developers → API keys (use the test-mode key while developing) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable API key | Same page as above |
| `STRIPE_WEBHOOK_SECRET` | Verifies that webhook requests actually came from Stripe | Printed by `stripe listen` locally, or from the webhook endpoint's settings in the Stripe Dashboard once deployed |
| `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_TEAM` | Price IDs for the Pro/Team recurring plans | [Stripe Dashboard](https://dashboard.stripe.com/test/products) → Product catalog — create a product with a recurring price for each plan |
| `NEXT_PUBLIC_APP_URL` | Base URL used to build Stripe redirect URLs | `http://localhost:3000` in dev |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Product analytics (optional — omit both to disable tracking entirely) | [PostHog](https://posthog.com/) → Project settings → Project API key. Host defaults to `https://us.i.posthog.com` |

All of these are validated at startup (`lib/env.ts`, wired via `instrumentation.ts`) — if one is missing, you'll get a clear error instead of a cryptic failure deep in a request handler. `NEXT_PUBLIC_POSTHOG_KEY`/`NEXT_PUBLIC_POSTHOG_HOST` are the exception — they're read directly from `process.env` in client components (Next.js only inlines `NEXT_PUBLIC_*` vars into the browser bundle when referenced literally), so they're validated as optional and analytics is simply disabled if unset.

## Analytics

Product analytics are wired up via [PostHog](https://posthog.com/) (`components/posthog-provider.tsx`, `lib/analytics.ts`) and are entirely optional — leave `NEXT_PUBLIC_POSTHOG_KEY` unset and nothing loads, no cookies are set, no requests go out. When configured:

- Pageviews and autocaptured clicks are tracked as visitors move through the app.
- Signed-in users are identified by their user id (`components/posthog-identify.tsx`), so events tie back to a real account instead of an anonymous visitor. Identity resets on sign-out.
- A `user_signed_up` event fires on successful account creation.

There's no cookie-consent banner included — add one (e.g. via PostHog's own consent APIs) before shipping to users in jurisdictions that require opt-in consent for non-essential cookies.

## Project structure

```
app/
├── (marketing)/    # public landing page
├── (auth)/         # sign-in / sign-up
├── (app)/          # protected dashboard + billing pages
├── api/
│   ├── auth/       # Auth.js handler
│   └── webhooks/   # Stripe webhook receiver
├── sitemap.ts      # generates /sitemap.xml (public routes only)
├── robots.ts       # generates /robots.txt
actions/            # Server Actions (sign-up, checkout, billing portal)
components/         # UI components (auth, billing, layout, shadcn primitives)
lib/                # auth config, Prisma client, Stripe client, plans, env validation, analytics, GitHub stars fetch
├── generated/      # Prisma client output — auto-generated by `prisma generate`, not hand-written, gitignored
prisma/             # schema + migrations
proxy.ts            # Next.js proxy (formerly "middleware") — redirects unauthenticated
                    # requests to /dashboard and /account to /sign-in
```

> **Note:** `lib/generated/` is produced by `pnpm prisma generate` (runs automatically as part of `pnpm prisma migrate dev`, or run it manually after editing `prisma/schema.prisma`). It's gitignored — safe to ignore when browsing or searching the codebase.

## Scripts

```bash
pnpm dev            # start the dev server
pnpm build           # production build
pnpm start           # run the production build
pnpm lint            # run ESLint
pnpm test            # run the test suite (Vitest)
pnpm prisma studio   # browse the database
pnpm prisma migrate dev --name <name>   # create and apply a migration
```
