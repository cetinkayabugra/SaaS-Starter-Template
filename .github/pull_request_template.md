<!--
Thanks for contributing. Keep this short — the diff says what changed,
this says why.
-->

## What and why

<!-- What does this change, and what problem does it solve? -->

## How to verify

<!--
The steps a reviewer should take to see it working. If it needs Stripe or
Postgres, say so — not every reviewer has both configured.
-->

## Checklist

- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass
- [ ] New env vars added to `lib/env.ts`, `.env.example`, and the README table
- [ ] New optional integrations degrade quietly when unconfigured
- [ ] `prisma/schema.prisma` changes include a migration
