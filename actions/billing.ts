"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function createCheckoutSession(priceId: string) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId!,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing?canceled=true`,
    subscription_data: { metadata: { userId: user.id } },
    client_reference_id: user.id,
  });

  redirect(checkout.url!);
}

export async function createPortalSession() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!subscription) redirect("/account/billing");

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing`,
  });

  redirect(portal.url);
}
