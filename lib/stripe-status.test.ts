import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import { mapStripeStatus } from "@/lib/stripe-status";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

describe("mapStripeStatus", () => {
  const cases: [Stripe.Subscription.Status, SubscriptionStatus][] = [
    ["trialing", SubscriptionStatus.TRIALING],
    ["active", SubscriptionStatus.ACTIVE],
    ["past_due", SubscriptionStatus.PAST_DUE],
    ["canceled", SubscriptionStatus.CANCELED],
    ["unpaid", SubscriptionStatus.UNPAID],
    ["incomplete", SubscriptionStatus.INCOMPLETE],
    ["incomplete_expired", SubscriptionStatus.INCOMPLETE_EXPIRED],
    ["paused", SubscriptionStatus.PAUSED],
  ];

  it.each(cases)("maps Stripe status %s to %s", (stripeStatus, expected) => {
    expect(mapStripeStatus(stripeStatus)).toBe(expected);
  });

  it("returns null for a status not recognized by the local enum", () => {
    expect(mapStripeStatus("some_future_status" as Stripe.Subscription.Status)).toBeNull();
  });
});
