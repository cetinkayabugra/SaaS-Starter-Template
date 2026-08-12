import { headers } from "next/headers";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { planForPriceId } from "@/lib/plans";
import { mapStripeStatus } from "@/lib/stripe-status";
import { env } from "@/lib/env";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && session.client_reference_id) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await upsertSubscription(subscription, session.client_reference_id);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId =
        subscription.metadata.userId ??
        (
          await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          })
        )?.userId;
      if (userId) await upsertSubscription(subscription, userId);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: SubscriptionStatus.CANCELED, plan: "free" },
      });
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.parent?.subscription_details?.subscription;
      if (subscriptionId) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId as string },
          data: { status: SubscriptionStatus.PAST_DUE },
        });
      }
      break;
    }
    default:
      break;
  }

  return new Response(null, { status: 200 });
}

async function upsertSubscription(subscription: Stripe.Subscription, userId: string) {
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
  };

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
