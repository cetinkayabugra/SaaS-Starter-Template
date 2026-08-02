import Link from "next/link";
import { CreditCard, LayoutDashboard, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanFeatureList } from "@/components/billing/PlanFeatureList";
import { TechStack } from "@/components/layout/TechStack";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Auth, ready to go",
    description: "Email/password and Google sign-in, sessions, and route protection out of the box.",
  },
  {
    icon: CreditCard,
    title: "Subscriptions built in",
    description: "Stripe Checkout, the Customer Portal, and webhook-synced plan status.",
  },
  {
    icon: LayoutDashboard,
    title: "A dashboard to build on",
    description: "A protected app shell already wired up. Add your product's real features next.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/dashboard" : "/sign-up";
  const ctaLabel = session?.user ? "Go to dashboard" : "Get started";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pt-10 pb-20 sm:gap-28 sm:pt-14 sm:pb-28">
      <section className="flex flex-col items-center gap-6 text-center">
        <span className="font-mono text-xs font-medium tracking-wide text-primary uppercase">
          Open-source SaaS starter
        </span>
        <h1 className="max-w-3xl font-mono text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          Your SaaS,{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            already wired up.
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance">
          Authentication, subscriptions, and a dashboard, built and tested. Spend your time on
          what makes your product different.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href={ctaHref} className={buttonVariants({ size: "lg" })}>
            {session?.user ? ctaLabel : "Get started for free"}
          </Link>
          <Link href="#pricing" className={buttonVariants({ size: "lg", variant: "outline" })}>
            View pricing
          </Link>
        </div>
        <TechStack />
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border-none bg-transparent shadow-none">
            <CardHeader className="items-center text-center sm:items-start sm:text-left">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <CardTitle className="mt-2">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section id="pricing" className="flex flex-col gap-10 scroll-mt-20">
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-mono text-3xl font-semibold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground">Start free. Upgrade whenever you need more.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 sm:items-start">
          {PLANS.map((plan) => (
            <div key={plan.name} className="relative">
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  Most popular
                </Badge>
              )}
              <Card className={cn(plan.popular && "border-primary shadow-md shadow-primary/10")}>
                <CardHeader>
                  <CardTitle>{plan.label}</CardTitle>
                  <p className="mt-1 text-2xl font-semibold">
                    {plan.priceLabel}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <PlanFeatureList features={plan.features} />
                  <Link
                    href={ctaHref}
                    className={buttonVariants({ variant: plan.popular ? "default" : "outline" })}
                  >
                    {ctaLabel}
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
