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

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
