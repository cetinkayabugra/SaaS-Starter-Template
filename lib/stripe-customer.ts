import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

type StripeCustomerUser = {
  id: string;
  email: string;
  name: string | null;
  stripeCustomerId: string | null;
};

export async function ensureStripeCustomerId(user: StripeCustomerUser): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
  });

  // Only persist if the user still has no customer id — guards against two
  // concurrent calls (e.g. a double-clicked checkout) both creating a Stripe
  // customer for the same user.
  const { count } = await prisma.user.updateMany({
    where: { id: user.id, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  });

  if (count === 0) {
    // Lost the race — another call already persisted a customer id first.
    // Discard the one we just created instead of leaving it orphaned.
    await stripe.customers.del(customer.id);
    const existing = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return existing.stripeCustomerId!;
  }

  return customer.id;
}
