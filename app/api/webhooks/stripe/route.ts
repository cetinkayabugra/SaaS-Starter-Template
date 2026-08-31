import { headers } from "next/headers";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { planForPriceId } from "@/lib/plans";
import { mapStripeStatus } from "@/lib/stripe-status";
import { isDuplicateEventError } from "@/lib/stripe-events";
import { env } from "@/lib/env";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  // Stripe sends `created` in seconds. Every write below is guarded against
  // events older than the one already applied, because delivery order isn't
  // guaranteed and a late event must not overwrite newer state.
  const eventAt = new Date(event.created * 1000);

  // Anything that needs the API (not just the event payload) is fetched before
  // the transaction — holding a DB transaction open across a network call to
  // Stripe would tie up a connection for the whole round trip.
  let checkoutSubscription: Stripe.Subscription | null = null;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.subscription && session.client_reference_id) {
      checkoutSubscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Claiming the event id and doing the write in one transaction is what
      // makes this idempotent: a redelivery collides on the primary key and
      // the whole transaction rolls back, leaving state untouched. Claiming
      // outside the transaction would risk marking an event processed whose
      // write then failed, and Stripe would never retry it.
      await tx.processedStripeEvent.create({
        data: { id: event.id, type: event.type },
      });

      await applyEvent(tx, event, eventAt, checkoutSubscription);
    });
  } catch (error) {
    if (isDuplicateEventError(error)) {
      // Already handled on an earlier delivery — acknowledge so Stripe stops.
      return new Response(null, { status: 200 });
    }

    // Signal failure so Stripe retries; the transaction rolled back, so the
    // retry starts from a clean slate.
    console.error(`Stripe webhook ${event.type} (${event.id}) failed:`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}

async function applyEvent(
  tx: Tx,
  event: Stripe.Event,
  eventAt: Date,
  checkoutSubscription: Stripe.Subscription | null
) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (checkoutSubscription && session.client_reference_id) {
        await upsertSubscription(
          tx,
          checkoutSubscription,
          session.client_reference_id,
          eventAt
        );
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId =
        subscription.metadata.userId ??
        (
          await tx.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          })
        )?.userId;
      if (userId) await upsertSubscription(tx, subscription, userId, eventAt);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await tx.subscription.updateMany({
        where: {
          stripeSubscriptionId: subscription.id,
          ...notStalerThan(eventAt),
        },
        data: {
          status: SubscriptionStatus.CANCELED,
          plan: "free",
          lastEventAt: eventAt,
        },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription;
      if (subscriptionId) {
        await tx.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscriptionId as string,
            ...notStalerThan(eventAt),
          },
          data: { status: SubscriptionStatus.PAST_DUE, lastEventAt: eventAt },
        });
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Where-clause fragment matching only rows whose last applied event is no
 * newer than this one. Rows that have never seen an event always match.
 */
function notStalerThan(eventAt: Date) {
  return {
    OR: [{ lastEventAt: null }, { lastEventAt: { lte: eventAt } }],
  };
}

async function upsertSubscription(
  tx: Tx,
  subscription: Stripe.Subscription,
  userId: string,
  eventAt: Date
) {
  const status = mapStripeStatus(subscription.status);
  if (!status) {
    console.error(
      `Unrecognized Stripe subscription status "${subscription.status}" for subscription ${subscription.id}; skipping sync.`
    );
    return;
  }

  const item = subscription.items.data[0];
  if (!item) {
    console.error(
      `Subscription ${subscription.id} has no line items; skipping sync.`
    );
    return;
  }
  const priceId = item.price.id;
  const productId =
    typeof item.price.product === "string" ? item.price.product : item.price.product.id;

  const data = {
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    stripeProductId: productId,
    status,
    plan: planForPriceId(priceId),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    lastEventAt: eventAt,
  };

  // updateMany rather than upsert so the staleness guard lives in the WHERE
  // clause — one atomic statement, no read-then-write race.
  const { count } = await tx.subscription.updateMany({
    where: { userId, ...notStalerThan(eventAt) },
    data,
  });

  if (count > 0) return;

  // No row matched: either this user has no subscription yet, or the stored
  // event is newer than this one and the write was correctly skipped.
  const existing = await tx.subscription.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!existing) {
    await tx.subscription.create({ data: { userId, ...data } });
  }
}
