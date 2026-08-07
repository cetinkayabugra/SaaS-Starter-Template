import type Stripe from "stripe";

import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus | null {
  const key = status.toUpperCase() as keyof typeof SubscriptionStatus;
  return key in SubscriptionStatus ? SubscriptionStatus[key] : null;
}
