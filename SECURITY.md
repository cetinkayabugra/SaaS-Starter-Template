# Security Policy

## Reporting a vulnerability

Please **don't open a public issue** for a security problem.

Use GitHub's private vulnerability reporting instead: go to the **Security** tab of this repository and choose **Report a vulnerability**. That opens a private thread visible only to the maintainers.

> Maintainers: this needs to be switched on once per repository under **Settings → Code security → Private vulnerability reporting**.

Useful things to include: what an attacker can do, the steps to reproduce it, and which version or commit you tested.

## Scope

This is a starter template, not a hosted service — there's no deployment to attack. What's in scope is anything that would make an application built from it insecure by default: authentication and session handling, the Stripe webhook receiver, the public chat endpoint, route protection in `proxy.ts`, and anything that leaks secrets or another user's data.

## Known limitations

These are deliberate trade-offs for a template, documented rather than fixed. They aren't vulnerabilities in themselves, but they need attention before you put a real deployment in front of users.

| Area | Limitation |
|---|---|
| Rate limiting | `lib/rate-limit.ts` keeps state in process memory. It resets on redeploy and isn't shared between instances, so on serverless the effective limit is multiplied by the instance count. Swap in a shared store before relying on it. |
| Client address | `getClientIp` trusts `x-forwarded-for` according to `TRUSTED_PROXY_HOPS`. Setting that higher than the number of proxies you actually run lets callers choose their own rate-limit bucket. |
| Chat endpoint | `/api/chat` is unauthenticated by design so the widget works for signed-out visitors, which means anyone who finds it can spend your API credits. Bounded by rate limiting, history caps and `max_tokens` — consider gating it behind `auth()`. |
| Content Security Policy | Not set. A correct CSP depends on which third parties your deployment loads, and a wrong one fails in ways that are hard to trace. Other hardening headers are in `next.config.ts`. |
| Secrets | Everything lives in `.env`, which is gitignored. There's no integration with a secrets manager. |

## Dependencies

Dependabot watches npm packages and GitHub Actions, and CI runs lint, typecheck, tests and a build on every pull request.
