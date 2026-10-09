import Link from "next/link";
import { Check } from "lucide-react";
import { SiGithub } from "react-icons/si";

import { auth } from "@/lib/auth";
import { getRepoStars, REPO_URL } from "@/lib/github";
import { buttonVariants } from "@/components/ui/button";
import { PlanFeatureList } from "@/components/billing/PlanFeatureList";
import { TechStack } from "@/components/layout/TechStack";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

/**
 * What the template already does, stated as the concrete artifact you get
 * rather than a benefit. `where` names the real files, which is the detail a
 * developer evaluating a starter actually wants.
 */
const WIRED = [
  {
    capability: "Authentication",
    detail: "Email and password, Google OAuth, JWT sessions, protected routes.",
    where: "lib/auth.ts · proxy.ts",
  },
  {
    capability: "Subscription billing",
    detail: "Stripe Checkout, the customer portal, and webhooks that survive retries.",
    where: "actions/billing.ts · api/webhooks/stripe",
  },
  {
    capability: "Database",
    detail: "Postgres through Prisma, with migrations and a typed client.",
    where: "prisma/schema.prisma",
  },
  {
    capability: "Application shell",
    detail: "A dashboard and billing page behind auth, ready for your features.",
    where: "app/(app)",
  },
  {
    capability: "Checks that run",
    detail: "Lint, typecheck, tests and a build on every pull request.",
    where: ".github/workflows/ci.yml",
  },
];

export default async function LandingPage() {
  const [session, stars] = await Promise.all([auth(), getRepoStars()]);
  const ctaHref = session?.user ? "/dashboard" : "/sign-up";
  const ctaLabel = session?.user ? "Go to dashboard" : "Get started";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-24 px-6 pt-16 pb-20 sm:gap-32 sm:pt-24 sm:pb-28">
      <section className="flex flex-col items-start gap-7">
        <Link
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <SiGithub className="size-4" />
          {stars !== null
            ? `Open source · ${stars.toLocaleString()} stars`
            : "Open source on GitHub"}
        </Link>

        <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          Auth, billing and a dashboard, already wired together.
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          The parts every SaaS needs and nobody wants to build twice. Clone it and spend
          your first week on the product instead of the plumbing.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href={ctaHref} className={buttonVariants({ size: "lg" })}>
            {session?.user ? ctaLabel : "Get started for free"}
          </Link>
          <Link href="#pricing" className={buttonVariants({ size: "lg", variant: "outline" })}>
            See pricing
          </Link>
        </div>

        <TechStack />
      </section>

      {/*
        A specification list rather than a card grid: the rows share one set of
        rules, so the eye reads down the column of capabilities instead of
        across three equally weighted boxes.
      */}
      <section className="flex flex-col">
        <h2 className="border-b pb-4 text-sm font-medium text-muted-foreground">
          What&apos;s already wired
        </h2>

        <dl className="divide-y">
          {WIRED.map(({ capability, detail, where }) => (
            <div
              key={capability}
              className="grid gap-x-8 gap-y-2 py-6 sm:grid-cols-[14rem_1fr] sm:py-7"
            >
              <dt className="flex items-baseline gap-2.5 text-base font-medium">
                <Check
                  aria-hidden
                  className="size-4 shrink-0 translate-y-0.5 text-included"
                />
                {capability}
              </dt>
              <dd className="flex flex-col gap-1.5">
                <p className="leading-relaxed text-muted-foreground">{detail}</p>
                <p className="font-mono text-xs text-muted-foreground/70">{where}</p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="pricing" className="flex scroll-mt-20 flex-col gap-8">
        <div className="flex flex-col gap-2 border-b pb-6">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">Pricing</h2>
          <p className="text-muted-foreground">
            Start free. The paid tiers exist so you can see billing work end to end.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col gap-5 bg-background p-6",
                // The recommended tier is distinguished by surface, not by an
                // extra outline and badge floating above the column.
                plan.popular && "bg-card"
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{plan.label}</h3>
                  {plan.popular && (
                    <span className="text-xs text-primary">Recommended</span>
                  )}
                </div>
                <p className="text-3xl font-semibold tracking-[-0.02em]">
                  {plan.priceLabel}
                  <span className="text-sm font-normal text-muted-foreground"> /month</span>
                </p>
              </div>

              <PlanFeatureList features={plan.features} />

              <Link
                href={ctaHref}
                className={cn(
                  buttonVariants({ variant: plan.popular ? "default" : "outline" }),
                  "mt-auto"
                )}
              >
                {ctaLabel}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
