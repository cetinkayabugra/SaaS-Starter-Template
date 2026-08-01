import { prisma } from "@/lib/prisma";

export async function getUserPlan(userId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  const isActive = subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
  return isActive ? subscription.plan : "free";
}
