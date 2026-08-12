"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { ensureStripeCustomerId } from "@/lib/stripe-customer";
import { env } from "@/lib/env";

export async function createCheckoutSession(priceId: string) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  let checkoutUrl: string;
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

    // Accounts created via OAuth (Google) skip actions/auth.ts's signUp flow,
    // so they never get a Stripe customer — ensureStripeCustomerId creates
    // one lazily here instead of assuming every sign-up path remembers to.
    const stripeCustomerId = await ensureStripeCustomerId(user);

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.NEXT_PUBLIC_APP_URL}/account/billing?success=true`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/account/billing?canceled=true`,
      subscription_data: { metadata: { userId: user.id } },
      client_reference_id: user.id,
    });

    if (!checkout.url) throw new Error("Stripe did not return a checkout URL");
    checkoutUrl = checkout.url;
  } catch (error) {
    console.error("createCheckoutSession failed:", error);
    return { error: "Couldn't start checkout. Please try again." };
  }

  redirect(checkoutUrl);
}

export async function createPortalSession() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  let portalUrl: string;
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    if (!subscription) {
      return { error: "No active subscription found." };
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/account/billing`,
    });
    portalUrl = portal.url;
  } catch (error) {
    console.error("createPortalSession failed:", error);
    return { error: "Couldn't open the billing portal. Please try again." };
  }

  redirect(portalUrl);
}
