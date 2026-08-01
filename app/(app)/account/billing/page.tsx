import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/plans";
import { PlanCard } from "@/components/billing/PlanCard";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  const currentPlan = isActive ? subscription.plan : "free";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Billing</h1>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Renews {subscription.currentPeriodEnd.toLocaleDateString()}
              {subscription.cancelAtPeriodEnd ? " (cancels at period end)" : ""}
            </p>
          )}
        </div>
        {isActive && <ManageBillingButton />}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.name}
            label={plan.label}
            priceLabel={plan.priceLabel}
            priceId={plan.priceId ?? null}
            features={plan.features}
            isCurrent={plan.name === currentPlan}
            popular={plan.popular}
          />
        ))}
      </div>
    </div>
  );
}
