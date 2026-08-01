import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLANS } from "@/lib/plans";

export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-24 px-6 py-24">
      <section className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Ship your SaaS, not your auth and billing.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A starter kit with authentication, subscriptions, and a dashboard already wired up —
          so you can focus on the product.
        </p>
        <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
          Get started for free
        </Link>
      </section>

      <section id="pricing" className="flex flex-col gap-8">
        <h2 className="text-center text-2xl font-semibold">Simple, transparent pricing</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
