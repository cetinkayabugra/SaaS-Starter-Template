import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/lib/generated/prisma/enums";

export function isSubscriptionActive(status: SubscriptionStatus | null | undefined): boolean {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}

export async function getUserPlan(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription || !isSubscriptionActive(subscription.status)) return "free";
  return subscription.plan;
}
