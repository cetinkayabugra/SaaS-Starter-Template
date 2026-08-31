# Contributing

Thanks for taking an interest. This is a starter template, so the bar for changes is: does it make the template a better *starting point*? Features that most projects would immediately delete are usually a poor fit; fixes, clearer defaults, and better docs are always welcome.

## Getting set up

Follow the [README's setup section](./README.md#setup). You need Postgres and a Stripe test account for the app to run end to end, but you do **not** need either to run the checks below — CI runs them with placeholder values.

## Before opening a PR

Run the same four checks CI runs:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four must pass. CI (`.github/workflows/ci.yml`) runs them on every pull request, so it's faster to catch failures locally.

## Things worth knowing

- **`lib/generated/` is generated, not written.** It's Prisma's client output and is gitignored. Run `pnpm prisma generate` after changing `prisma/schema.prisma`. Ignore it when searching the codebase.
- **Route protection lives in `proxy.ts`**, not `middleware.ts` — Next.js 16 renamed it. Pages under `/dashboard` and `/account` also keep their own `redirect()` guard as defense in depth.
- **Validation schemas are shared.** `lib/validations.ts` is the single source for both client-side form rules and server-side checks. Don't add a parallel client-only rule; it will drift.
- **Environment variables go through `lib/env.ts`.** Add new ones to the Zod schema, `.env.example`, and the README table. Read them from `env`, not `process.env`, so a missing value fails at startup with a clear message instead of deep inside a request.
- **Optional integrations must degrade quietly.** Analytics and the chat widget are both gated on their keys being present — an unconfigured deployment should behave as if the feature doesn't exist, not show a broken one.

## Tests

Vitest, colocated as `*.test.ts` next to the code. There's no browser test setup, so prefer extracting logic into a pure function and testing that directly over reaching for component tests — see `lib/chat-stream.ts` for that pattern.

## Commits

Conventional-commit prefixes (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). Keep one logical change per commit; it makes the history worth reading.
